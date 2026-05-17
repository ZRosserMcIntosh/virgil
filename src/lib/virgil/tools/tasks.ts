/**
 * VIRGIL — Task management tool.
 * Allows the agent to create, complete, and list tasks via conversation.
 */

import type { ToolDefinition, ToolCall, ToolResult } from "./types";

export const taskTool: ToolDefinition = {
  name: "manage_tasks",
  description: "Create, complete, or list tasks. Actions: 'create', 'complete', 'list'.",
  parameters: {
    type: "object",
    properties: {
      action: {
        type: "string",
        enum: ["create", "complete", "list"],
        description: "The action to perform",
      },
      title: {
        type: "string",
        description: "Task title (for create)",
      },
      priority: {
        type: "string",
        enum: ["LOW", "MEDIUM", "HIGH", "URGENT"],
        description: "Priority (for create)",
      },
      taskId: {
        type: "string",
        description: "Task ID (for complete)",
      },
      status: {
        type: "string",
        enum: ["TODO", "IN_PROGRESS", "DONE"],
        description: "Filter by status (for list)",
      },
    },
    required: ["action"],
  },
};

export async function executeTask(call: ToolCall): Promise<ToolResult> {
  const { prisma } = await import("@/lib/db/client");
  const args = call.arguments as Record<string, string>;

  try {
    if (args.action === "list") {
      const where: Record<string, any> = {};
      if (args.status) where.status = args.status;
      const tasks = await (prisma as any).task.findMany({
        where,
        orderBy: [{ priority: "desc" }, { dueDate: "asc" }],
        take: 20,
      });
      const content = tasks.length === 0
        ? "No tasks found."
        : tasks.map((t: any) =>
            `• [${t.status}] ${t.title} (${t.priority}${t.dueDate ? `, due ${new Date(t.dueDate).toLocaleDateString()}` : ""})`
          ).join("\n");
      return { toolCallId: call.id, name: call.name, content, isError: false };
    }

    if (args.action === "create") {
      if (!args.title) return { toolCallId: call.id, name: call.name, content: "Error: title is required.", isError: true };
      const task = await (prisma as any).task.create({
        data: { title: args.title, priority: args.priority ?? "MEDIUM" },
      });
      return { toolCallId: call.id, name: call.name, content: `Task created: "${task.title}" [${task.priority}]`, isError: false };
    }

    if (args.action === "complete") {
      if (!args.taskId) return { toolCallId: call.id, name: call.name, content: "Error: taskId required.", isError: true };
      const task = await (prisma as any).task.update({
        where: { id: args.taskId },
        data: { status: "DONE", completedAt: new Date() },
      });
      return { toolCallId: call.id, name: call.name, content: `Task completed: "${task.title}"`, isError: false };
    }

    return { toolCallId: call.id, name: call.name, content: "Unknown action.", isError: true };
  } catch (err: any) {
    return { toolCallId: call.id, name: call.name, content: err?.message ?? "Task tool error", isError: true };
  }
}
