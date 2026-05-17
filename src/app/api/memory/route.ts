/**
 * POST /api/memory — manual memory creation
 * GET  /api/memory — list memories with optional filters
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
  const category = searchParams.get("category") ?? undefined;
  const status = searchParams.get("status") ?? "ACTIVE";

  const where: Record<string, any> = { ownerId: userId, status };
  if (category) where.category = category;

  const memories = await prisma.memory.findMany({
    where,
    orderBy: [{ importance: "desc" }, { updatedAt: "desc" }],
    take: 100,
  });

  return NextResponse.json(memories);
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const userId = (session.user as any).id as string;

  const body = await req.json();
  if (!body.title) return NextResponse.json({ error: "Title required" }, { status: 400 });

  const memory = await prisma.memory.create({
    data: {
      ownerId: userId,
      title: body.title,
      content: body.content ?? null,
      category: body.category ?? "PERMANENT_FACT",
      sensitivity: body.sensitivity ?? "BUSINESS_INTERNAL",
      importance: body.importance ?? 50,
      sourceType: "USER_DIRECT",
      status: "ACTIVE",
    },
  });

  return NextResponse.json(memory, { status: 201 });
}
