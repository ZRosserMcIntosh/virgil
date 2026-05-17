/**
 * GET  /api/tasks?status=TODO&projectId=...
 * POST /api/tasks  { title, description?, priority?, projectId?, dueDate?, tags? }
 */

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/options";
import { prisma } from "@/lib/db/client";

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status") ?? undefined;
  const projectId = searchParams.get("projectId") ?? undefined;

  const where: Record<string, any> = {};
  if (status) where.status = status;
  if (projectId) where.projectId = projectId;

  const tasks = await prisma.task.findMany({
    where,
    orderBy: [{ priority: "desc" }, { dueDate: "asc" }, { createdAt: "desc" }],
    take: 100,
    include: { project: { select: { name: true, slug: true } } },
  });

  return NextResponse.json(tasks);
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { title, description, priority, projectId, dueDate, tags } = body;

  if (!title || typeof title !== "string") {
    return NextResponse.json({ error: "Title required" }, { status: 400 });
  }

  const task = await prisma.task.create({
    data: {
      title: title.slice(0, 200),
      description: description ?? null,
      priority: priority ?? "MEDIUM",
      projectId: projectId ?? null,
      dueDate: dueDate ? new Date(dueDate) : null,
      tags: tags ?? [],
    },
  });

  return NextResponse.json(task, { status: 201 });
}
