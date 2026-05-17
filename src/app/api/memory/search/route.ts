/**
 * GET /api/memory/search?q=...
 * Full-text search across memory entries.
 */

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/options";
import { prisma } from "@/lib/db/client";

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q")?.trim();
  const category = searchParams.get("category") ?? undefined;

  if (!q || q.length < 2) return NextResponse.json([]);

  const where: Record<string, any> = {
    OR: [
      { title: { contains: q, mode: "insensitive" } },
      { content: { contains: q, mode: "insensitive" } },
      { summary: { contains: q, mode: "insensitive" } },
    ],
    status: "ACTIVE",
  };
  if (category) where.category = category;

  const memories = await prisma.memory.findMany({
    where,
    orderBy: { importance: "desc" },
    take: 30,
    select: {
      id: true,
      title: true,
      content: true,
      category: true,
      sensitivity: true,
      importance: true,
      sourceType: true,
      createdAt: true,
    },
  });

  return NextResponse.json(memories);
}
