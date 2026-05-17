/**
 * PATCH  /api/memory/[id] — inline edit
 * DELETE /api/memory/[id] — soft-delete (set status = DELETED)
 */

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/options";
import { prisma } from "@/lib/db/client";

interface Ctx { params: Promise<{ id: string }> }

export async function PATCH(req: Request, ctx: Ctx) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const userId = (session.user as any).id as string;
  const { id } = await ctx.params;

  const mem = await prisma.memory.findFirst({ where: { id, ownerId: userId } });
  if (!mem) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = await req.json();
  const data: Record<string, any> = {};
  if (body.title !== undefined) data.title = body.title;
  if (body.content !== undefined) data.content = body.content;
  if (body.category !== undefined) data.category = body.category;
  if (body.importance !== undefined) data.importance = body.importance;
  if (body.status !== undefined) data.status = body.status;

  const updated = await prisma.memory.update({ where: { id }, data });
  return NextResponse.json(updated);
}

export async function DELETE(_req: Request, ctx: Ctx) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const userId = (session.user as any).id as string;
  const { id } = await ctx.params;

  const mem = await prisma.memory.findFirst({ where: { id, ownerId: userId } });
  if (!mem) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await prisma.memory.update({ where: { id }, data: { status: "DELETED" } });
  return NextResponse.json({ ok: true });
}
