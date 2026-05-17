/**
 * VIRGIL — Provider adapter.
 *
 * Uniform interface across cloud and local LLMs.
 * Supports: openai, anthropic, mock, local.
 */

import OpenAI from "openai";
import Anthropic from "@anthropic-ai/sdk";

let _openai: OpenAI | null = null;
function getOpenAI(): OpenAI {
  if (!_openai) _openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  return _openai;
}

let _anthropic: Anthropic | null = null;
function getAnthropic(): Anthropic {
  if (!_anthropic) _anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  return _anthropic;
}

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

/**
 * Streaming variant — returns a ReadableStream of text chunks (plain strings).
 * Only OpenAI and Anthropic support streaming; others fall back to callProvider.
 */
export async function callProviderStream(req: ProviderRequest): Promise<ReadableStream<string>> {
  if (req.provider === "openai" && process.env.OPENAI_API_KEY) {
    return streamOpenAI(req);
  }
  if (req.provider === "anthropic" && process.env.ANTHROPIC_API_KEY) {
    return streamAnthropic(req);
  }
  // Fallback: collect full response and emit as single chunk
  const result = await callProvider(req);
  return new ReadableStream<string>({
    start(controller) {
      controller.enqueue(result.text);
      controller.close();
    },
  });
}

async function streamOpenAI(req: ProviderRequest): Promise<ReadableStream<string>> {
  const client = getOpenAI();
  const stream = await client.chat.completions.create({
    model: req.model,
    messages: req.messages as OpenAI.Chat.ChatCompletionMessageParam[],
    temperature: req.temperature ?? 0.7,
    max_tokens: req.maxTokens ?? 1200,
    stream: true,
  });

  return new ReadableStream<string>({
    async start(controller) {
      try {
        for await (const chunk of stream) {
          const delta = chunk.choices[0]?.delta?.content;
          if (delta) controller.enqueue(delta);
        }
      } finally {
        controller.close();
      }
    },
    cancel() {
      stream.controller.abort();
    },
  });
}

async function streamAnthropic(req: ProviderRequest): Promise<ReadableStream<string>> {
  const client = getAnthropic();
  const systemMsg = req.messages.find((m) => m.role === "system");
  const convoMsgs = req.messages.filter((m) => m.role !== "system") as Anthropic.MessageParam[];

  const stream = await client.messages.stream({
    model: req.model,
    max_tokens: req.maxTokens ?? 1200,
    system: systemMsg?.content as string | undefined,
    messages: convoMsgs,
  });

  return new ReadableStream<string>({
    async start(controller) {
      try {
        for await (const chunk of stream) {
          if (
            chunk.type === "content_block_delta" &&
            chunk.delta.type === "text_delta"
          ) {
            controller.enqueue(chunk.delta.text);
          }
        }
      } finally {
        controller.close();
      }
    },
  });
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

// ── OpenAI ──────────────────────────────────────────────────────────────────
async function callOpenAI(req: ProviderRequest): Promise<Omit<ProviderResult, "latencyMs">> {
  if (!process.env.OPENAI_API_KEY) return callMock(req);
  const client = getOpenAI();
  const res = await client.chat.completions.create({
    model: req.model,
    messages: req.messages as OpenAI.Chat.ChatCompletionMessageParam[],
    temperature: req.temperature ?? 0.7,
    max_tokens: req.maxTokens ?? 1000,
  });
  const text = res.choices[0]?.message?.content ?? "";
  return {
    provider: "openai",
    model: req.model,
    text,
    promptTokens: res.usage?.prompt_tokens ?? 0,
    completionTokens: res.usage?.completion_tokens ?? 0,
    costUsd: 0,
  };
}

// ── Anthropic ───────────────────────────────────────────────────────────────
async function callAnthropic(req: ProviderRequest): Promise<Omit<ProviderResult, "latencyMs">> {
  if (!process.env.ANTHROPIC_API_KEY) return callMock(req);
  const client = getAnthropic();
  // Anthropic separates system from conversation messages
  const systemMsg = req.messages.find((m) => m.role === "system");
  const convoMsgs = req.messages.filter((m) => m.role !== "system") as Anthropic.MessageParam[];
  const res = await client.messages.create({
    model: req.model,
    max_tokens: req.maxTokens ?? 1000,
    system: systemMsg?.content as string | undefined,
    messages: convoMsgs,
  });
  const block = res.content[0];
  const text = block?.type === "text" ? block.text : "";
  return {
    provider: "anthropic",
    model: req.model,
    text,
    promptTokens: res.usage?.input_tokens ?? 0,
    completionTokens: res.usage?.output_tokens ?? 0,
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
