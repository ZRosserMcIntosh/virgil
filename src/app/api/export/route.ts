/**
 * GET /api/export — full data export (owner only)
 * Returns JSON with memories, conversations, profile facts, tasks, contacts.
 */

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/options";
import { prisma } from "@/lib/db/client";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const companion = (session.user as any).companion ?? "VIRGIL";
  if (companion !== "VIRGIL") return NextResponse.json({ error: "Owner only" }, { status: 403 });
  const userId = (session.user as any).id as string;

  const [memories, conversations, profileFacts, tasks, contacts] = await Promise.all([
    prisma.memory.findMany({ where: { ownerId: userId }, orderBy: { createdAt: "desc" } }),
    prisma.virgilConversation.findMany({
      where: { userId },
      include: { messages: { orderBy: { createdAt: "asc" } } },
      orderBy: { createdAt: "desc" },
    }),
    prisma.profileFact.findMany({ orderBy: { createdAt: "asc" } }),
    (prisma as any).task.findMany({ orderBy: { createdAt: "desc" } }),
    (prisma as any).contact.findMany({ orderBy: { name: "asc" } }),
  ]);

  const exportData = {
    exportedAt: new Date().toISOString(),
    version: "1.0",
    memories,
    conversations: conversations.map((c: any) => ({
      id: c.id,
      title: c.title,
      companion: c.companion,
      createdAt: c.createdAt,
      messages: c.messages.map((m: any) => ({
        role: m.role,
        content: m.content,
        meta: m.meta,
        createdAt: m.createdAt,
      })),
    })),
    profileFacts,
    tasks,
    contacts,
  };

  return new Response(JSON.stringify(exportData, null, 2), {
    headers: {
      "Content-Type": "application/json",
      "Content-Disposition": `attachment; filename="virgil-export-${new Date().toISOString().slice(0, 10)}.json"`,
    },
  });
}
