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

  const { id } = await params;
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

  const { id } = await params;
  await prisma.profileFact.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
