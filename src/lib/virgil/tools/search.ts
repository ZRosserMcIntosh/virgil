/**
 * Tool: search_web
 *
 * Real-time web search. Uses Perplexity API if PERPLEXITY_API_KEY is set,
 * otherwise falls back to DuckDuckGo Instant Answer API (no key required,
 * limited to factual lookups).
 *
 * Perplexity is strongly recommended for a real intelligence system.
 * API key: https://docs.perplexity.ai — ~$5/month for typical usage.
 */

import type { ToolDefinition, ToolCall, ToolResult } from "./types";

export const searchTool: ToolDefinition = {
  name: "search_web",
  description:
    "Searches the web for current information. Use when the user asks about " +
    "news, recent events, stock prices, sports scores, factual questions that " +
    "may have changed since training, or anything requiring up-to-date data. " +
    "Do NOT use for general knowledge questions you can answer from training.",
  parameters: {
    type: "object",
    properties: {
      query: {
        type: "string",
        description: "The search query. Be specific. Use keywords, not sentences.",
      },
      focus: {
        type: "string",
        enum: ["general", "news", "finance", "academic"],
        description: "Search focus. Defaults to 'general'.",
      },
    },
    required: ["query"],
  },
};

export async function executeSearch(call: ToolCall): Promise<ToolResult> {
  const query = call.arguments.query as string;
  const focus = (call.arguments.focus as string | undefined) ?? "general";

  try {
    if (process.env.PERPLEXITY_API_KEY) {
      return await searchPerplexity(call, query, focus);
    }
    return await searchDuckDuckGo(call, query);
  } catch (err: any) {
    return {
      toolCallId: call.id,
      name: call.name,
      content: `Search failed: ${err?.message ?? "Unknown error"}`,
      isError: true,
    };
  }
}

// ── Perplexity ────────────────────────────────────────────────────────────────

async function searchPerplexity(call: ToolCall, query: string, focus: string): Promise<ToolResult> {
  const modelMap: Record<string, string> = {
    general:  "sonar",
    news:     "sonar-online",
    finance:  "sonar-online",
    academic: "sonar-reasoning",
  };
  const model = modelMap[focus] ?? "sonar";

  const res = await fetch("https://api.perplexity.ai/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${process.env.PERPLEXITY_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      messages: [
        {
          role: "system",
          content: "You are a research assistant. Return factual, concise answers with sources. Be brief and specific.",
        },
        { role: "user", content: query },
      ],
      max_tokens: 600,
      return_citations: true,
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Perplexity error ${res.status}: ${err}`);
  }

  const data = await res.json();
  const answer = data.choices?.[0]?.message?.content ?? "No result.";
  const citations: string[] = data.citations ?? [];

  const result = {
    answer,
    citations: citations.slice(0, 5),
    source: "Perplexity",
    query,
  };

  return {
    toolCallId: call.id,
    name: call.name,
    content: JSON.stringify(result),
    isError: false,
  };
}

// ── DuckDuckGo fallback ───────────────────────────────────────────────────────

async function searchDuckDuckGo(call: ToolCall, query: string): Promise<ToolResult> {
  const url = `https://api.duckduckgo.com/?q=${encodeURIComponent(query)}&format=json&no_html=1&skip_disambig=1`;
  const res = await fetch(url, { headers: { "Accept-Encoding": "identity" } });
  const data = await res.json();

  const abstract = data.AbstractText as string | undefined;
  const answer = data.Answer as string | undefined;
  const relatedTopics: string[] = (data.RelatedTopics ?? [])
    .slice(0, 3)
    .map((t: any) => t.Text ?? "")
    .filter(Boolean);

  if (!abstract && !answer && relatedTopics.length === 0) {
    return {
      toolCallId: call.id,
      name: call.name,
      content: JSON.stringify({
        answer: "No instant answer available. Set PERPLEXITY_API_KEY for full web search.",
        source: "DuckDuckGo Instant Answers",
        query,
      }),
      isError: false,
    };
  }

  return {
    toolCallId: call.id,
    name: call.name,
    content: JSON.stringify({
      answer: answer ?? abstract ?? relatedTopics[0],
      related: relatedTopics,
      source: "DuckDuckGo Instant Answers",
      note: "Set PERPLEXITY_API_KEY for full real-time web search.",
      query,
    }),
    isError: false,
  };
}
