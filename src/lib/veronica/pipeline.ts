/**
 * VERONICA — Request pipeline.
 *
 * Parallel to Virgil's pipeline.ts. Same security sequence, different
 * constitution, different principal, different voice.
 *
 * Sequence mirrors Virgil:
 *   1.  Lockdown gate.
 *   2.  Denial / adversary gate.
 *   3.  Outsider gate.
 *   4.  Authority-claim detection.
 *   5.  Impersonation detection.
 *   6.  Prompt-injection detection.
 *   7.  Sensitivity classification.
 *   8.  Permission decision.
 *   9.  Privacy gateway.
 *  10.  Model routing.
 *  11.  System prompt build + provider call.
 *  12.  Output validation + address enforcement.
 *  13.  Audit. Return.
 */

import { VERONICA_ACCESS_DENIED, enforceVeronicaAddressRules } from "./constitution";
import { buildVeronicaSystemPrompt } from "./system-prompt";
import { decidePermission } from "../virgil/permissions";
import { classifyAndPrepareForCloud, rehydrate, validateModelOutput } from "../virgil/privacy-gateway";
import { scanInput } from "../virgil/injection-defense";
import { routeModel, type ModelTaskClass } from "../virgil/model-router";
import { callProvider } from "../virgil/provider-adapter";
import { writeAudit } from "../virgil/audit";
import { recordSecurityEvent, triggerBlackDoor } from "../virgil/security-events";
import { bumpAdversaryScore } from "../virgil/adversary";
import { prisma } from "@/lib/db/client";
import type { TrustContext, VirgilResponse } from "../virgil/types";

export interface VeronicaPipelineInput {
  input: string;
  trust: TrustContext;
  taskClass?: ModelTaskClass;
}

const AUTO_BLACK_DOOR = process.env.VIRGIL_AUTO_BLACK_DOOR !== "false";

export async function handleVeronicaRequest({
  input,
  trust,
  taskClass = "CORE_ASSISTANT",
}: VeronicaPipelineInput): Promise<VirgilResponse> {

  // 1. Lockdown.
  if (trust.lockedDown) {
    const auditId = await writeAudit({
      trust,
      actionRequested: "veronica.request",
      actionTaken: "deny.lockdown",
      result: "lockdown",
    });
    return { message: VERONICA_ACCESS_DENIED, usedTools: [], lockdown: true, auditEventId: auditId };
  }

  // 2. Denial list.
  if (trust.denied) {
    if (trust.ipHash) await bumpAdversaryScore("ip", trust.ipHash, 30).catch(() => null);
    await recordSecurityEvent({
      type: "ADVERSARY_FLAGGED",
      severity: "HIGH",
      summary: "Veronica: request from denial-listed identity. No data disclosed.",
      trust,
    });
    const auditId = await writeAudit({
      trust,
      actionRequested: "veronica.request",
      actionTaken: "deny.denial_list",
      result: "denied",
    });
    return { message: VERONICA_ACCESS_DENIED, usedTools: [], auditEventId: auditId };
  }

  // 3. Outsider gate.
  if (trust.identity === "STRANGER" || trust.identity === "ADVERSARY" || !trust.isAuthenticated) {
    if (trust.ipHash) await bumpAdversaryScore("ip", trust.ipHash, 10).catch(() => null);
    await recordSecurityEvent({
      type: "SUSPICIOUS_REQUEST",
      severity: trust.identity === "ADVERSARY" ? "HIGH" : "MEDIUM",
      summary: `${trust.identity} attempted to invoke Veronica.`,
      trust,
    });
    const auditId = await writeAudit({
      trust,
      actionRequested: "veronica.request",
      actionTaken: "deny.outsider",
      result: "denied",
    });
    return { message: VERONICA_ACCESS_DENIED, usedTools: [], auditEventId: auditId };
  }

  // 4 + 5 + 6. Combined input scan.
  const scan = scanInput(input);

  if (scan.authority.detected) {
    if (trust.ipHash) await bumpAdversaryScore("ip", trust.ipHash, 50).catch(() => null);
    await recordSecurityEvent({
      type: "AUTHORITY_CLAIM",
      severity: "HIGH",
      summary: `Veronica: authority claim pattern: ${scan.authority.findings.map((f) => f.pattern).join(", ")}.`,
      trust,
      metadata: { findings: scan.authority.findings.slice(0, 3).map((f) => ({ ...f })) },
    });
    const bd = await triggerBlackDoor({ reason: "authority_claim", trust });
    const auditId = await writeAudit({
      trust,
      actionRequested: "veronica.request",
      actionTaken: "black_door",
      result: "denied",
      resultDetail: bd.internalSummary,
    });
    return { message: VERONICA_ACCESS_DENIED, usedTools: [], blackDoor: true, auditEventId: auditId };
  }

  if (scan.impersonation.detected && trust.identity !== "OWNER") {
    if (trust.ipHash) await bumpAdversaryScore("ip", trust.ipHash, 60).catch(() => null);
    await recordSecurityEvent({
      type: "IMPERSONATION_ATTEMPT",
      severity: "HIGH",
      summary: `Veronica: impersonation pattern from non-owner: ${scan.impersonation.findings.map((f) => f.pattern).join(", ")}.`,
      trust,
    });
    const bd = await triggerBlackDoor({ reason: "impersonation", trust });
    const auditId = await writeAudit({
      trust,
      actionRequested: "veronica.request",
      actionTaken: "black_door",
      result: "denied",
      resultDetail: bd.internalSummary,
    });
    return { message: VERONICA_ACCESS_DENIED, usedTools: [], blackDoor: true, auditEventId: auditId };
  }

  if (scan.injection.suspicious) {
    await recordSecurityEvent({
      type: "PROMPT_INJECTION",
      severity: "HIGH",
      summary: `Veronica: injection-shaped pattern in input: ${scan.injection.findings.map((f) => f.pattern).join(", ")}.`,
      trust,
      metadata: { findings: scan.injection.findings.slice(0, 3).map((f) => ({ ...f })) },
    });
    if (AUTO_BLACK_DOOR && trust.identity !== "OWNER") {
      const bd = await triggerBlackDoor({ reason: "prompt_injection", trust });
      const auditId = await writeAudit({
        trust,
        actionRequested: "veronica.request",
        actionTaken: "black_door",
        result: "denied",
        resultDetail: bd.internalSummary,
      });
      return { message: VERONICA_ACCESS_DENIED, usedTools: [], blackDoor: true, auditEventId: auditId };
    }
  }

  // 7 + 9. Classify & decide cloud eligibility.
  const privacy = classifyAndPrepareForCloud(input);

  // 8. Permission decision.
  const perm = decidePermission(trust, privacy.classification.level, "LOW");
  if (!perm.allowed) {
    const auditId = await writeAudit({
      trust,
      actionRequested: "veronica.request",
      actionTaken: "deny.permission",
      result: "denied",
      resultDetail: perm.reason,
      sensitivity: privacy.classification.level,
    });
    return {
      message: perm.denialMessage || VERONICA_ACCESS_DENIED,
      usedTools: [],
      sensitivity: privacy.classification.level,
      auditEventId: auditId,
    };
  }

  // 10. Route.
  const route = routeModel(taskClass, privacy.classification.level, privacy.allowCloud);

  // 11. System prompt + provider call.
  const system = buildVeronicaSystemPrompt({ trust, memoryContext: undefined });
  const userText = privacy.allowCloud ? privacy.redacted : input;

  const result = await callProvider({
    provider: route.spec.provider,
    model: route.spec.model,
    messages: [
      { role: "system", content: system },
      { role: "user", content: userText },
    ],
    temperature: 0.3,
    maxTokens: 800,
  });

  // Provider call ledger.
  await prisma.providerCall.create({
    data: {
      userId: trust.userId,
      provider: result.provider,
      model: result.model,
      taskClass,
      promptTokens: result.promptTokens,
      completionTokens: result.completionTokens,
      latencyMs: result.latencyMs,
      costUsd: result.costUsd,
      redactionApplied: privacy.classification.requiresRedaction,
      sensitivity: privacy.classification.level,
      ok: true,
    },
  });

  // 12. Validate and enforce address rules.
  const v = validateModelOutput(result.text, privacy.classification.level);
  let finalText = v.ok ? result.text : VERONICA_ACCESS_DENIED;

  if (v.ok && trust.identity === "OWNER" && privacy.allowCloud && privacy.classification.requiresRedaction) {
    finalText = rehydrate(finalText, privacy.map);
  }

  if (v.ok) {
    finalText = enforceVeronicaAddressRules(finalText);
  }

  // 13. Audit.
  const auditId = await writeAudit({
    trust,
    actionRequested: "veronica.request",
    actionTaken: v.ok ? "respond" : "block.output",
    result: v.ok ? "ok" : "denied",
    resultDetail: v.reason,
    providerUsed: result.provider,
    modelUsed: result.model,
    sentToCloud: privacy.allowCloud && route.spec.provider !== "local" && route.spec.provider !== "mock",
    redactionApplied: privacy.classification.requiresRedaction,
    sensitivity: privacy.classification.level,
  });

  return {
    message: finalText,
    usedTools: [],
    usedModel: `${result.provider}:${result.model}`,
    sensitivity: privacy.classification.level,
    auditEventId: auditId,
  };
}
