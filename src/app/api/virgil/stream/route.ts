/**
 * POST /api/virgil/stream
 *
 * Streaming variant of the Virgil/Verônica endpoint.
 * Returns a text/event-stream (SSE) response — each event is a text delta.
 *
 * Event format:
 *   data: <chunk>\n\n
 *   data: [DONE]\n\n        ← signals end of stream
 *   data: [META]{"usedModel":"...","sensitivity":"..."}\n\n  ← final metadata
 *
 * The client reads this with a ReadableStream or EventSource and appends
 * each chunk to the assistant message in real time.
 */

import { NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/lib/auth/options";
import { buildTrustContext } from "@/lib/auth/trust-context";
import { checkRateLimit } from "@/lib/auth/rate-limit";
import { ACCESS_DENIED_MESSAGE, enforceAddressRules } from "@/lib/virgil/constitution";
import { VERONICA_ACCESS_DENIED } from "@/lib/veronica/constitution";
import { buildSystemPrompt } from "@/lib/virgil/system-prompt";
import { buildVeronicaSystemPrompt } from "@/lib/veronica/system-prompt";
import { decidePermission } from "@/lib/virgil/permissions";
import { classifyAndPrepareForCloud, rehydrate, validateModelOutput } from "@/lib/virgil/privacy-gateway";
import { scanInput } from "@/lib/virgil/injection-defense";
import { routeModel } from "@/lib/virgil/model-router";
import { callProviderAgentStream } from "@/lib/virgil/provider-adapter";
import { retrieveRelevantMemories, maxSensitivity } from "@/lib/virgil/memory";
import { buildProfileContext } from "@/lib/virgil/profile-context";
import { OWNER_TOOLS, PEPPER_TOOLS, GUEST_TOOLS } from "@/lib/virgil/tools/registry";
import { executeTools } from "@/lib/virgil/tools/executor";
import type { CompanionId } from "@/lib/companions/types";

export const runtime = "nodejs";

const Body = z.object({
  input: z.string().min(1).max(8000),
  taskClass: z.string().optional(),
  modelOverride: z.string().optional(), // e.g. "gpt-4o", "gpt-4o-mini", "claude-3-5-sonnet"
});

export async function POST(req: NextRequest) {
  const companionHeader = req.headers.get("x-virgil-companion") ?? "VIRGIL";
  const companion: CompanionId = companionHeader === "VERONICA" ? "VERONICA" : "VIRGIL";
  const accessDenied = companion === "VERONICA" ? VERONICA_ACCESS_DENIED : ACCESS_DENIED_MESSAGE;

  let parsed: z.infer<typeof Body>;
  try {
    parsed = Body.parse(await req.json());
  } catch {
    return deny(accessDenied);
  }

  const session = await getServerSession(authOptions);
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? undefined;
  const userAgent = req.headers.get("user-agent") ?? undefined;
  const fp = req.headers.get("x-virgil-device") ?? undefined;

  const trust = await buildTrustContext({ session, ip, userAgent, trustedDeviceFingerprint: fp });

  // ── Rate limiting ─────────────────────────────────────────────────────────
  if (trust.userId) {
    const limited = checkRateLimit(trust.userId, "stream", trust.isOwner ? 60 : 20);
    if (limited) return limited;
  }

  // ── Security gates (mirror pipeline.ts non-streaming checks) ─────────────
  if (trust.lockedDown || trust.denied) return deny(accessDenied);
  if (trust.identity === "STRANGER" || trust.identity === "ADVERSARY" || !trust.isAuthenticated) {
    return deny(accessDenied);
  }

  const injection = scanInput(parsed.input);
  if (injection.injection.suspicious) return deny(accessDenied);

  const privacy = classifyAndPrepareForCloud(parsed.input);
  const perm = decidePermission(trust, privacy.classification.level, "LOW");
  if (!perm.allowed) return deny(perm.denialMessage || accessDenied);

  // ── Memory retrieval ──────────────────────────────────────────────────────
  let memoryContextText: string | undefined;
  let combinedSensitivity = privacy.classification.level;
  let cloudAllowedFinal = privacy.allowCloud;

  try {
    const memCtx = await retrieveRelevantMemories({
      input: parsed.input,
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
  } catch { /* best-effort */ }

  const routeFinal = routeModel(
    (parsed.taskClass as never) ?? "CORE_ASSISTANT",
    combinedSensitivity,
    cloudAllowedFinal,
  );

  // Apply model override if provided (owner only, non-local-only mode)
  if (parsed.modelOverride && trust.isOwner && process.env.VIRGIL_LOCAL_ONLY !== "true") {
    const allowed = ["gpt-4o", "gpt-4o-mini", "claude-3-5-sonnet", "claude-3-haiku"];
    if (allowed.includes(parsed.modelOverride)) {
      const provider = parsed.modelOverride.startsWith("claude") ? "anthropic" : "openai";
      routeFinal.spec = { provider, model: parsed.modelOverride };
      routeFinal.reason = `manual override: ${parsed.modelOverride}`;
    }
  }

  // ── Profile context ───────────────────────────────────────────────────────
  let profileContextText = "";
  try {
    if (trust.isOwner || trust.isPepper) {
      const profileCtx = await buildProfileContext();
      profileContextText = profileCtx.combined;
    }
  } catch { /* best-effort */ }

  // ── System prompt ─────────────────────────────────────────────────────────
  const system = companion === "VERONICA"
    ? buildVeronicaSystemPrompt({ trust, memoryContext: memoryContextText })
    : buildSystemPrompt({ trust, memoryContext: memoryContextText, profileContext: profileContextText });

  const userText = cloudAllowedFinal ? privacy.redacted : parsed.input;

  // ── Stream ────────────────────────────────────────────────────────────────
  // ── Select tools based on identity ───────────────────────────────────────
  const availableTools =
    trust.isOwner  ? OWNER_TOOLS  :
    trust.isPepper ? PEPPER_TOOLS :
    GUEST_TOOLS;

  const textStream = await callProviderAgentStream(
    {
      provider: routeFinal.spec.provider,
      model: routeFinal.spec.model,
      messages: [
        { role: "system", content: system },
        { role: "user",   content: userText },
      ],
      tools: availableTools,
      temperature: 0.3,
      maxTokens: 1200,
    },
    async (calls) => {
      const results = await executeTools(
        calls,
        { userId: trust.userId ?? "unknown" },
      );
      return results.map((r) => ({
        toolCallId: r.toolCallId,
        name: r.name,
        content: r.content,
      }));
    },
  );

  const meta = {
    usedModel: `${routeFinal.spec.provider}:${routeFinal.spec.model}`,
    sensitivity: combinedSensitivity,
  };

  // ── SSE response ──────────────────────────────────────────────────────────
  const sseStream = new ReadableStream({
    async start(controller) {
      const enc = new TextEncoder();
      let fullText = "";

      const reader = textStream.getReader();
      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          fullText += value;
          // Escape newlines so SSE framing stays intact
          const escaped = value.replace(/\n/g, "\\n");
          controller.enqueue(enc.encode(`data: ${escaped}\n\n`));
        }
      } finally {
        reader.releaseLock();
      }

      // Post-process: rehydrate redactions for owner
      if (trust.identity === "OWNER" && cloudAllowedFinal && privacy.classification.requiresRedaction) {
        fullText = rehydrate(fullText, privacy.map);
      }
      fullText = enforceAddressRules(fullText, trust.identity);

      // Send final metadata then DONE
      controller.enqueue(enc.encode(`data: [META]${JSON.stringify(meta)}\n\n`));
      controller.enqueue(enc.encode(`data: [DONE]\n\n`));
      controller.close();
    },
  });

  return new Response(sseStream, {
    headers: {
      "Content-Type":  "text/event-stream",
      "Cache-Control": "no-cache",
      "Connection":    "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}

function deny(message: string) {
  return new Response(
    `data: ${message}\n\ndata: [DONE]\n\n`,
    {
      headers: { "Content-Type": "text/event-stream", "Cache-Control": "no-cache" },
    },
  );
}
