/**
 * VIRGIL — Provider adapter.
 *
 * Uniform interface across cloud and local LLMs.
 * Supports: openai, anthropic, mock, local.
 */

import OpenAI from "openai";
import Anthropic from "@anthropic-ai/sdk";
import type { ToolDefinition, ToolCall } from "./tools/types";

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

// ── Tool-calling (OpenAI only) ────────────────────────────────────────────────

export interface ToolCallRequest extends ProviderRequest {
  tools: ToolDefinition[];
}

export interface ToolCallResponse {
  /** Tool calls requested by the model, if any. */
  toolCalls: ToolCall[];
  /** Final text (empty string if model requested tool calls instead). */
  text: string;
  /** OpenAI message to append to history for multi-turn tool loops. */
  assistantMessage: OpenAI.Chat.ChatCompletionMessageParam;
}

/**
 * First pass of an agentic tool loop.
 * Returns either tool calls to execute, or a final text response.
 * Only supports OpenAI — falls back to callProvider for other providers.
 */
export async function callProviderWithTools(
  req: ToolCallRequest,
): Promise<ToolCallResponse> {
  if (req.provider !== "openai" || !process.env.OPENAI_API_KEY) {
    const result = await callProvider(req);
    return { toolCalls: [], text: result.text, assistantMessage: { role: "assistant", content: result.text } };
  }

  const client = getOpenAI();
  const { toOpenAITools } = await import("./tools/registry");
  const tools = toOpenAITools(req.tools);

  const res = await client.chat.completions.create({
    model: req.model,
    messages: req.messages as OpenAI.Chat.ChatCompletionMessageParam[],
    tools,
    tool_choice: "auto",
    temperature: req.temperature ?? 0.3,
    max_tokens: req.maxTokens ?? 1200,
  });

  const choice = res.choices[0];
  if (!choice) {
    return { toolCalls: [], text: "", assistantMessage: { role: "assistant", content: "" } };
  }
  const msg = choice.message;

  if (msg.tool_calls && msg.tool_calls.length > 0) {
    const toolCalls: ToolCall[] = msg.tool_calls
      .filter((tc): tc is OpenAI.Chat.ChatCompletionMessageFunctionToolCall =>
        "function" in tc && tc.type === "function"
      )
      .map((tc) => ({
        id: tc.id,
        name: tc.function.name,
        arguments: (() => { try { return JSON.parse(tc.function.arguments || "{}"); } catch { return {}; } })(),
      }));
    return { toolCalls, text: "", assistantMessage: msg };
  }

  return {
    toolCalls: [],
    text: msg.content ?? "",
    assistantMessage: msg,
  };
}

/**
 * Complete an agentic tool loop:
 * 1. Ask model (with tools available)
 * 2. If tool calls requested, execute them all
 * 3. Feed results back, get final streaming response
 *
 * Returns a ReadableStream of the final text (same format as callProviderStream).
 */
export async function callProviderAgentStream(
  req: ToolCallRequest,
  executeFn: (calls: ToolCall[]) => Promise<Array<{ toolCallId: string; name: string; content: string }>>,
): Promise<ReadableStream<string>> {
  if (req.provider !== "openai" || !process.env.OPENAI_API_KEY) {
    return callProviderStream(req);
  }

  // Step 1: first pass with tools
  const firstPass = await callProviderWithTools(req);

  // No tool calls — stream the text directly
  if (firstPass.toolCalls.length === 0) {
    return new ReadableStream<string>({
      start(controller) {
        controller.enqueue(firstPass.text);
        controller.close();
      },
    });
  }

  // Step 2: execute tools in parallel
  const toolResults = await executeFn(firstPass.toolCalls);

  // Step 3: build continuation messages
  const continuationMessages: OpenAI.Chat.ChatCompletionMessageParam[] = [
    ...req.messages as OpenAI.Chat.ChatCompletionMessageParam[],
    firstPass.assistantMessage,
    ...toolResults.map((r) => ({
      role: "tool" as const,
      tool_call_id: r.toolCallId,
      content: r.content,
    })),
  ];

  // Step 4: stream final response
  return streamOpenAI({
    ...req,
    messages: continuationMessages.map((m) => ({
      role: m.role as "system" | "user" | "assistant",
      content: typeof m.content === "string" ? m.content : JSON.stringify(m.content ?? ""),
    })),
  });
}
