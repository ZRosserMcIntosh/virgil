/**
 * PATCH /api/tasks/[id]  — update status, title, etc.
 * DELETE /api/tasks/[id] — delete a task
 */

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/options";
import { prisma } from "@/lib/db/client";

interface Ctx { params: Promise<{ id: string }> }

export async function PATCH(req: Request, ctx: Ctx) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await ctx.params;

  const body = await req.json();
  const data: Record<string, any> = {};

  if (body.title) data.title = String(body.title).slice(0, 200);
  if (body.description !== undefined) data.description = body.description;
  if (body.status) data.status = body.status;
  if (body.priority) data.priority = body.priority;
  if (body.dueDate !== undefined) data.dueDate = body.dueDate ? new Date(body.dueDate) : null;
  if (body.status === "DONE") data.completedAt = new Date();
  if (body.status === "TODO" || body.status === "IN_PROGRESS") data.completedAt = null;

  const task = await (prisma.task as any).update({ where: { id }, data });
  return NextResponse.json(task);
}

export async function DELETE(_req: Request, ctx: Ctx) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await ctx.params;

  await (prisma.task as any).delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
