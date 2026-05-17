/**
 * POST /api/conversations/[id]/export
 * Export a conversation as JSON or Markdown.
 */

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/options";
import { prisma } from "@/lib/db/client";

interface Ctx { params: Promise<{ id: string }> }

export async function POST(req: Request, ctx: Ctx) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const userId = (session.user as any).id as string;
  const { id } = await ctx.params;

  const conv = await prisma.virgilConversation.findFirst({
    where: { id, userId },
    include: { messages: { orderBy: { createdAt: "asc" } } },
  });
  if (!conv) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = await req.json().catch(() => ({}));
  const format = (body as any).format ?? "json";

  if (format === "markdown") {
    const lines: string[] = [
      `# ${conv.title ?? "Untitled Conversation"}`,
      `*Exported ${new Date().toISOString()}*`,
      "",
    ];
    for (const m of conv.messages) {
      const label = m.role === "user" ? "**You**" : "**Virgil**";
      lines.push(`### ${label}`);
      lines.push(m.content);
      lines.push("");
    }
    return new Response(lines.join("\n"), {
      headers: {
        "Content-Type": "text/markdown",
        "Content-Disposition": `attachment; filename="conversation-${id}.md"`,
      },
    });
  }

  // Default: JSON
  return NextResponse.json({
    id: conv.id,
    title: conv.title,
    companion: conv.companion,
    createdAt: conv.createdAt,
    messages: conv.messages.map((m) => ({
      role: m.role,
      content: m.content,
      meta: m.meta,
      createdAt: m.createdAt,
    })),
  });
}
