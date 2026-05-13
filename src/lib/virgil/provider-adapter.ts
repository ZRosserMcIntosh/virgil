/**
 * VIRGIL — Provider adapter.
 *
 * Uniform interface across cloud and local LLMs. v0 ships:
 *   - mock (always available, deterministic-ish)
 *   - openai stub (only used if OPENAI_API_KEY is set)
 *   - anthropic stub (only used if ANTHROPIC_API_KEY is set)
 *
 * Real provider clients (openai/sdk, @anthropic-ai/sdk) are intentionally NOT
 * imported yet to keep the dependency surface small. Wire them in later by
 * replacing the body of `callOpenAI` / `callAnthropic`.
 */

export interface ProviderMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface ProviderRequest {
  provider: "mock" | "openai" | "anthropic" | "local";
  model: string;
  messages: ProviderMessage[];
  temperature?: number;
  maxTokens?: number;
}

export interface ProviderResult {
  provider: ProviderRequest["provider"];
  model: string;
  text: string;
  promptTokens: number;
  completionTokens: number;
  latencyMs: number;
  costUsd: number;
}

export async function callProvider(req: ProviderRequest): Promise<ProviderResult> {
  const start = Date.now();
  switch (req.provider) {
    case "openai":
      return finish(await callOpenAI(req), start);
    case "anthropic":
      return finish(await callAnthropic(req), start);
    case "local":
      return finish(await callLocal(req), start);
    case "mock":
    default:
      return finish(callMock(req), start);
  }
}

function finish(partial: Omit<ProviderResult, "latencyMs">, start: number): ProviderResult {
  return { ...partial, latencyMs: Date.now() - start };
}

// ── Mock ────────────────────────────────────────────────────────────────────
function callMock(req: ProviderRequest): Omit<ProviderResult, "latencyMs"> {
  const lastUser = [...req.messages].reverse().find((m) => m.role === "user");
  const reply = mockReply(lastUser?.content ?? "");
  return {
    provider: "mock",
    model: req.model,
    text: reply,
    promptTokens: estimateTokens(req.messages.map((m) => m.content).join("\n")),
    completionTokens: estimateTokens(reply),
    costUsd: 0,
  };
}

function mockReply(input: string): string {
  const trimmed = input.trim();
  if (!trimmed) return "Standing by, sir.";
  if (/^brief|^briefing|^status|^report/i.test(trimmed)) {
    return [
      "Good evening, sir. The mock provider is currently active; live connectors are not configured.",
      "Three notional matters: (1) Katura traffic vs. checkout conversion, (2) one K99 architecture decision pending,",
      "(3) one personal message I would draft but not send tonight. Nothing requires emergency action.",
    ].join(" ");
  }
  if (/\bsend\b|\bemail\b|\bdeploy\b|\bmerge\b/i.test(trimmed)) {
    return "Prepared, not executed. I have staged this in the approval queue pending your explicit confirmation.";
  }
  return "Acknowledged. (Mock provider — real model not configured.)";
}

function estimateTokens(s: string): number {
  return Math.max(1, Math.ceil(s.length / 4));
}

// ── OpenAI (stub) ───────────────────────────────────────────────────────────
async function callOpenAI(req: ProviderRequest): Promise<Omit<ProviderResult, "latencyMs">> {
  if (!process.env.OPENAI_API_KEY) return callMock(req);
  // TODO: wire real client. Intentional stub in v0.1.
  return {
    provider: "openai",
    model: req.model,
    text: "(openai stub — install and wire openai client to enable)",
    promptTokens: 0,
    completionTokens: 0,
    costUsd: 0,
  };
}

// ── Anthropic (stub) ────────────────────────────────────────────────────────
async function callAnthropic(req: ProviderRequest): Promise<Omit<ProviderResult, "latencyMs">> {
  if (!process.env.ANTHROPIC_API_KEY) return callMock(req);
  // TODO: wire real client. Intentional stub in v0.1.
  return {
    provider: "anthropic",
    model: req.model,
    text: "(anthropic stub — install and wire @anthropic-ai/sdk to enable)",
    promptTokens: 0,
    completionTokens: 0,
    costUsd: 0,
  };
}

// ── Local (stub) ────────────────────────────────────────────────────────────
async function callLocal(req: ProviderRequest): Promise<Omit<ProviderResult, "latencyMs">> {
  // TODO: connect to local node (Ollama / llama.cpp / etc.)
  return {
    provider: "local",
    model: req.model,
    text: "(local provider not yet configured — falling back to mock behavior)",
    promptTokens: 0,
    completionTokens: 0,
    costUsd: 0,
  };
}
