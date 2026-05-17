import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/options";
import { prisma } from "@/lib/db/client";

// ── PATCH /api/profile-facts/[id] ────────────────────────────────────────
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const companion = (session.user as any).companion ?? "VIRGIL";
  const isOwner = companion === "VIRGIL";
  const { id } = await params;

  // Verify ownership: owner edits ROSSER facts, Stella edits STELLA facts.
  const existing = await prisma.profileFact.findUnique({ where: { id } });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (isOwner  && existing.subject !== "ROSSER") return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  if (!isOwner && existing.subject !== "STELLA") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json();

  const fact = await prisma.profileFact.update({
    where: { id },
    data: {
      ...(body.category       !== undefined && { category:        body.category.trim() }),
      ...(body.label          !== undefined && { label:           body.label.trim() }),
      ...(body.value          !== undefined && { value:           body.value.trim() }),
      ...(body.veronicaVisible !== undefined && { veronicaVisible: !!body.veronicaVisible }),
      ...(body.pinned         !== undefined && { pinned:          !!body.pinned }),
      ...(body.sortOrder      !== undefined && { sortOrder:       body.sortOrder }),
    },
  });

  return NextResponse.json(fact);
}

// ── DELETE /api/profile-facts/[id] ───────────────────────────────────────
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const companion = (session.user as any).companion ?? "VIRGIL";
  const isOwner = companion === "VIRGIL";
  const { id } = await params;

  const existing = await prisma.profileFact.findUnique({ where: { id } });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (isOwner  && existing.subject !== "ROSSER") return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  if (!isOwner && existing.subject !== "STELLA") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  await prisma.profileFact.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
