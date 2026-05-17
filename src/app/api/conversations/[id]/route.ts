/**
 * PATCH /api/conversations/[id]
 * Update conversation metadata (title, pinned).
 *
 * DELETE /api/conversations/[id]
 * Delete a conversation and all its messages.
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

  const conv = await prisma.virgilConversation.findFirst({ where: { id, userId } });
  if (!conv) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = await req.json();
  const data: Record<string, any> = {};
  if (typeof body.title === "string") data.title = body.title.slice(0, 80);

  const updated = await prisma.virgilConversation.update({ where: { id }, data });
  return NextResponse.json(updated);
}

export async function DELETE(_req: Request, ctx: Ctx) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const userId = (session.user as any).id as string;
  const { id } = await ctx.params;

  const conv = await prisma.virgilConversation.findFirst({ where: { id, userId } });
  if (!conv) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await prisma.virgilConversation.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
