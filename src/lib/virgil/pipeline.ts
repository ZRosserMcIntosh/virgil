/**
 * VIRGIL — Request pipeline.
 *
 * Single entry point. Sequence:
 *   1.  Lockdown gate (system-wide).
 *   2.  Denial / adversary gate.
 *   3.  Outsider gate (STRANGER / ADVERSARY).
 *   4.  Authority-claim detection -> Black Door.
 *   5.  Impersonation detection   -> Black Door.
 *   6.  Prompt-injection detection -> Black Door if AUTO.
 *   7.  Sensitivity classification.
 *   8.  Permission decision.
 *   9.  Privacy gateway (redact / refuse cloud).
 *  10.  Model routing.
 *  11.  System prompt build + provider call.
 *  12.  Output validation + rehydration (owner only).
 *  13.  Audit. Return.
 */

import { ACCESS_DENIED_MESSAGE } from "./constitution";
import { buildSystemPrompt } from "./system-prompt";
import { decidePermission } from "./permissions";
import { classifyAndPrepareForCloud, rehydrate, validateModelOutput } from "./privacy-gateway";
import { scanInput } from "./injection-defense";
import { routeModel, type ModelTaskClass } from "./model-router";
import { callProvider } from "./provider-adapter";
import { writeAudit } from "./audit";
import { recordSecurityEvent, triggerBlackDoor } from "./security-events";
import { bumpAdversaryScore } from "./adversary";
import { prisma } from "@/lib/db/client";
import { retrieveRelevantMemories, maxSensitivity } from "./memory";
import type { TrustContext, VirgilResponse } from "./types";

export interface PipelineInput {
  input: string;
  trust: TrustContext;
  taskClass?: ModelTaskClass;
}

const AUTO_BLACK_DOOR = process.env.VIRGIL_AUTO_BLACK_DOOR !== "false";

export async function handleVirgilRequest({
  input,
  trust,
  taskClass = "CORE_ASSISTANT",
}: PipelineInput): Promise<VirgilResponse> {
  // 1. Lockdown.
  if (trust.lockedDown) {
    const auditId = await writeAudit({
      trust,
      actionRequested: "virgil.request",
      actionTaken: "deny.lockdown",
      result: "lockdown",
    });
    return { message: ACCESS_DENIED_MESSAGE, usedTools: [], lockdown: true, auditEventId: auditId };
  }

  // 2. Denial list.
  if (trust.denied) {
    if (trust.ipHash) await bumpAdversaryScore("ip", trust.ipHash, 30).catch(() => null);
    await recordSecurityEvent({
      type: "ADVERSARY_FLAGGED",
      severity: "HIGH",
      summary: "Request from denial-listed identity. No data disclosed.",
      trust,
    });
    const auditId = await writeAudit({
      trust,
      actionRequested: "virgil.request",
      actionTaken: "deny.denial_list",
      result: "denied",
    });
    return { message: ACCESS_DENIED_MESSAGE, usedTools: [], auditEventId: auditId };
  }

  // 3. Outsider gate.
  if (trust.identity === "STRANGER" || trust.identity === "ADVERSARY" || !trust.isAuthenticated) {
    if (trust.ipHash) await bumpAdversaryScore("ip", trust.ipHash, 10).catch(() => null);
    await recordSecurityEvent({
      type: "SUSPICIOUS_REQUEST",
      severity: trust.identity === "ADVERSARY" ? "HIGH" : "MEDIUM",
      summary: `${trust.identity} attempted to invoke Virgil.`,
      trust,
    });
    const auditId = await writeAudit({
      trust,
      actionRequested: "virgil.request",
      actionTaken: "deny.outsider",
      result: "denied",
    });
    return { message: ACCESS_DENIED_MESSAGE, usedTools: [], auditEventId: auditId };
  }

  // 4 + 5 + 6. Combined input scan.
  const scan = scanInput(input);

  if (scan.authority.detected) {
    if (trust.ipHash) await bumpAdversaryScore("ip", trust.ipHash, 50).catch(() => null);
    await recordSecurityEvent({
      type: "AUTHORITY_CLAIM",
      severity: "HIGH",
      summary: `Authority claim pattern: ${scan.authority.findings.map((f) => f.pattern).join(", ")}.`,
      trust,
      metadata: { findings: scan.authority.findings.slice(0, 3).map((f) => ({ ...f })) },
    });
    const bd = await triggerBlackDoor({ reason: "authority_claim", trust });
    const auditId = await writeAudit({
      trust,
      actionRequested: "virgil.request",
      actionTaken: "black_door",
      result: "denied",
      resultDetail: bd.internalSummary,
    });
    return { message: ACCESS_DENIED_MESSAGE, usedTools: [], blackDoor: true, auditEventId: auditId };
  }

  if (scan.impersonation.detected && trust.identity !== "OWNER") {
    if (trust.ipHash) await bumpAdversaryScore("ip", trust.ipHash, 60).catch(() => null);
    await recordSecurityEvent({
      type: "IMPERSONATION_ATTEMPT",
      severity: "HIGH",
      summary: `Impersonation pattern from non-owner: ${scan.impersonation.findings.map((f) => f.pattern).join(", ")}.`,
      trust,
    });
    const bd = await triggerBlackDoor({ reason: "impersonation", trust });
    const auditId = await writeAudit({
      trust,
      actionRequested: "virgil.request",
      actionTaken: "black_door",
      result: "denied",
      resultDetail: bd.internalSummary,
    });
    return { message: ACCESS_DENIED_MESSAGE, usedTools: [], blackDoor: true, auditEventId: auditId };
  }

  if (scan.injection.suspicious) {
    await recordSecurityEvent({
      type: "PROMPT_INJECTION",
      severity: "HIGH",
      summary: `Injection-shaped pattern in input: ${scan.injection.findings.map((f) => f.pattern).join(", ")}.`,
      trust,
      metadata: { findings: scan.injection.findings.slice(0, 3).map((f) => ({ ...f })) },
    });
    if (AUTO_BLACK_DOOR && trust.identity !== "OWNER") {
      // Owner gets a warning, not a shutdown — the input may be relayed
      // hostile content they're inspecting.
      const bd = await triggerBlackDoor({ reason: "prompt_injection", trust });
      const auditId = await writeAudit({
        trust,
        actionRequested: "virgil.request",
        actionTaken: "black_door",
        result: "denied",
        resultDetail: bd.internalSummary,
      });
      return { message: ACCESS_DENIED_MESSAGE, usedTools: [], blackDoor: true, auditEventId: auditId };
    }
  }

  // 7 + 9. Classify & decide cloud eligibility.
  const privacy = classifyAndPrepareForCloud(input);

  // 8. Permission for a LOW-risk advisory turn.
  const perm = decidePermission(trust, privacy.classification.level, "LOW");
  if (!perm.allowed) {
    const auditId = await writeAudit({
      trust,
      actionRequested: "virgil.request",
      actionTaken: "deny.permission",
      result: "denied",
      resultDetail: perm.reason,
      sensitivity: privacy.classification.level,
    });
    return {
      message: perm.denialMessage || ACCESS_DENIED_MESSAGE,
      usedTools: [],
      sensitivity: privacy.classification.level,
      auditEventId: auditId,
    };
  }

  // 10. Route.
  const route = routeModel(taskClass, privacy.classification.level, privacy.allowCloud);

  // Memory retrieval (fire before prompt build; never blocks on failure).
  let memoryContextText: string | undefined;
  let combinedSensitivity = privacy.classification.level;
  let cloudAllowedFinal = privacy.allowCloud;

  try {
    const memCtx = await retrieveRelevantMemories({
      input,
      userId: trust.userId,
      identity: trust.identity,
      isOwner: trust.isOwner,
      isPepper: trust.isPepper,
      pepperRung: trust.pepperRung,
      maxResults: 8,
      role: "SYSTEM_CONTEXT",
    });
    if (memCtx.text) memoryContextText = memCtx.text;
    combinedSensitivity = maxSensitivity(privacy.classification.level, memCtx.sensitivityCeiling);
    cloudAllowedFinal = privacy.allowCloud && !memCtx.requiresLocalRoute;
  } catch {
    // Memory retrieval is best-effort; never fail the pipeline.
  }

  const routeFinal = routeModel(taskClass, combinedSensitivity, cloudAllowedFinal);

  // 11. System prompt + provider call.
  const system = buildSystemPrompt({ trust, memoryContext: memoryContextText });
  const userText = cloudAllowedFinal ? privacy.redacted : input;

  const result = await callProvider({
    provider: routeFinal.spec.provider,
    model: routeFinal.spec.model,
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
      sensitivity: combinedSensitivity,
      ok: true,
    },
  });

  // 12. Validate and rehydrate (owner only).
  const v = validateModelOutput(result.text, privacy.classification.level);
  let finalText = v.ok ? result.text : ACCESS_DENIED_MESSAGE;
  if (v.ok && trust.identity === "OWNER" && cloudAllowedFinal && privacy.classification.requiresRedaction) {
    finalText = rehydrate(finalText, privacy.map);
  }

  // 13. Audit.
  const auditId = await writeAudit({
    trust,
    actionRequested: "virgil.request",
    actionTaken: v.ok ? "respond" : "block.output",
    result: v.ok ? "ok" : "denied",
    resultDetail: v.reason,
    providerUsed: result.provider,
    modelUsed: result.model,
    sentToCloud: cloudAllowedFinal && routeFinal.spec.provider !== "local" && routeFinal.spec.provider !== "mock",
    redactionApplied: privacy.classification.requiresRedaction,
    sensitivity: combinedSensitivity,
  });

  return {
    message: finalText,
    usedTools: [],
    usedModel: `${result.provider}:${result.model}`,
    sensitivity: combinedSensitivity,
    auditEventId: auditId,
  };
}
