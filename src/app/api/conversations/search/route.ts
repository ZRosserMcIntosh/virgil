/**
 * GET  /api/conversations/search?q=...&companion=VIRGIL
 * Full-text search across conversation messages.
 */

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/options";
import { prisma } from "@/lib/db/client";

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const userId = (session.user as any).id as string;

  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q")?.trim();
  const companion = searchParams.get("companion") ?? "VIRGIL";

  if (!q || q.length < 2) return NextResponse.json([]);

  const messages = await prisma.virgilMessage.findMany({
    where: {
      conversation: { userId, companion },
      content: { contains: q, mode: "insensitive" },
    },
    orderBy: { createdAt: "desc" },
    take: 30,
    select: {
      id: true,
      role: true,
      content: true,
      createdAt: true,
      conversation: {
        select: { id: true, title: true },
      },
    },
  });

  return NextResponse.json(messages);
}
