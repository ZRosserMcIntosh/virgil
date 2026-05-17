/**
 * VIRGIL — Contact lookup tool.
 * Lets the agent query the CRM: "What do I know about [person]?"
 */

import type { ToolDefinition, ToolCall, ToolResult } from "./types";

export const contactTool: ToolDefinition = {
  name: "lookup_contact",
  description: "Search the contacts/people database by name.",
  parameters: {
    type: "object",
    properties: {
      name: { type: "string", description: "Name to search for" },
    },
    required: ["name"],
  },
};

export async function executeContact(call: ToolCall): Promise<ToolResult> {
  const { prisma } = await import("@/lib/db/client");
  const name = call.arguments.name as string;

  try {
    const contacts = await (prisma as any).contact.findMany({
      where: { name: { contains: name, mode: "insensitive" } },
      take: 5,
    });

    if (contacts.length === 0) {
      return { toolCallId: call.id, name: call.name, content: `No contacts matching "${name}".`, isError: false };
    }

    const lines = contacts.map((c: any) => {
      const parts = [c.name];
      if (c.role) parts.push(`(${c.role})`);
      if (c.company) parts.push(`at ${c.company}`);
      if (c.email) parts.push(`— ${c.email}`);
      if (c.notes) parts.push(`\n  Notes: ${c.notes}`);
      if (c.birthday) parts.push(`\n  Birthday: ${c.birthday}`);
      return parts.join(" ");
    });

    return { toolCallId: call.id, name: call.name, content: lines.join("\n\n"), isError: false };
  } catch (err: any) {
    return { toolCallId: call.id, name: call.name, content: err?.message ?? "Contact lookup error", isError: true };
  }
}
