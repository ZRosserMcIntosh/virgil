/**
 * Tool: get_memory
 *
 * Allows Virgil to explicitly query its own memory store during a conversation.
 * Useful when the user references something from the past and Virgil needs
 * to pull more context than was pre-injected into the system prompt.
 */

import type { ToolDefinition, ToolCall, ToolResult } from "./types";
import { prisma } from "@/lib/db/client";

export const memoryTool: ToolDefinition = {
  name: "get_memory",
  description:
    "Retrieves stored memories relevant to a query. Use when the user references " +
    "a past conversation, a stored fact, a decision, a project detail, or anything " +
    "that may have been logged previously. This supplements — does not replace — " +
    "the memory already in the system prompt.",
  parameters: {
    type: "object",
    properties: {
      query: {
        type: "string",
        description: "What to search for in memory. Use specific keywords.",
      },
      category: {
        type: "string",
        description: "Optional category filter: 'project', 'personal', 'decision', 'health', 'relationship', 'finance'.",
      },
    },
    required: ["query"],
  },
};

export async function executeMemory(
  call: ToolCall,
  userId: string,
): Promise<ToolResult> {
  const query   = call.arguments.query as string;
  const category = call.arguments.category as string | undefined;

  try {
    const where: any = {
      userId,
      approved: true,
      ...(category ? { category: { contains: category, mode: "insensitive" } } : {}),
    };

    // Simple text search — upgrade to pgvector when embeddings are live
    const memories = await (prisma as any).virgilMemory.findMany({
      where: {
        ...where,
        OR: [
          { title:   { contains: query, mode: "insensitive" } },
          { content: { contains: query, mode: "insensitive" } },
        ],
      },
      orderBy: { importance: "desc" },
      take: 6,
      select: { title: true, content: true, category: true, importance: true, createdAt: true },
    });

    if (!memories.length) {
      return {
        toolCallId: call.id,
        name: call.name,
        content: JSON.stringify({ found: 0, memories: [], query }),
        isError: false,
      };
    }

    return {
      toolCallId: call.id,
      name: call.name,
      content: JSON.stringify({ found: memories.length, memories, query }),
      isError: false,
    };
  } catch (err: any) {
    return {
      toolCallId: call.id,
      name: call.name,
      content: `Memory retrieval failed: ${err?.message ?? "Unknown error"}`,
      isError: true,
    };
  }
}
