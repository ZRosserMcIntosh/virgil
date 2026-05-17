/**
 * POST /api/conversations/[id]/auto-title
 * Uses the LLM to generate a title from the first exchange.
 */

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/options";
import { prisma } from "@/lib/db/client";
import { callProvider } from "@/lib/virgil/provider-adapter";

interface Ctx { params: Promise<{ id: string }> }

export async function POST(_req: Request, ctx: Ctx) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const userId = (session.user as any).id as string;
  const { id } = await ctx.params;

  const conv = await prisma.virgilConversation.findFirst({
    where: { id, userId },
    include: { messages: { take: 4, orderBy: { createdAt: "asc" } } },
  });
  if (!conv) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (conv.messages.length === 0) return NextResponse.json({ title: null });

  // Build a minimal prompt for title generation
  const transcript = conv.messages
    .map((m) => `${m.role}: ${m.content.slice(0, 200)}`)
    .join("\n");

  try {
    const result = await callProvider({
      provider: "openai",
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: "You are a title generator. Given a conversation excerpt, output a short title (4-8 words). No quotes, no punctuation at the end." },
        { role: "user", content: transcript },
      ],
      temperature: 0.3,
      maxTokens: 30,
    });

    const title = result.text.trim().slice(0, 80);
    await prisma.virgilConversation.update({ where: { id }, data: { title } });
    return NextResponse.json({ title });
  } catch {
    // Fallback: use first user message
    const fallback = conv.messages[0]?.content.slice(0, 60) ?? "Untitled";
    await prisma.virgilConversation.update({ where: { id }, data: { title: fallback } });
    return NextResponse.json({ title: fallback });
  }
}
