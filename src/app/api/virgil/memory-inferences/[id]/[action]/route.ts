import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/options";
import { prisma } from "@/lib/db/client";

export const dynamic = "force-dynamic";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string; action: string }> },
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return NextResponse.json({ message: "Access denied." }, { status: 403 });
  const owner = await prisma.user.findUnique({ where: { email: session.user.email } });
  if (!owner || owner.identity !== "OWNER") return NextResponse.json({ message: "Access denied." }, { status: 403 });

  const { action, id } = await params;

  if (action === "approve") {
    const inference = await prisma.virgilMemoryInference.update({
      where: { id },
      data: { status: "APPROVED" },
    });

    // Save to main Memory table
    await prisma.memory.create({
      data: {
        ownerId: owner.id,
        title: inference.proposedMemory.slice(0, 120),
        content: inference.proposedMemory,
        category: "PERSONAL",
        sensitivity: inference.sensitivity === "SACRED" ? "PERSONAL_SACRED"
          : inference.sensitivity === "HIGH" ? "PERSONAL_PRIVATE"
          : inference.sensitivity === "LOW" ? "PUBLIC"
          : "PERSONAL_PRIVATE",
        cloudAllowed: inference.sensitivity === "LOW",
        neverSendToCloud: inference.sensitivity === "SACRED",
        importance: Math.round(inference.confidence * 100),
        confidence: inference.confidence,
        source: "questions_page",
        status: "ACTIVE",
        writePolicy: "REQUIRE_OWNER_REVIEW",
        verified: true,
      },
    });

    await prisma.virgilMemoryInference.update({
      where: { id },
      data: { status: "SAVED" },
    });

    return NextResponse.json({ ok: true, action: "approved_and_saved" });
  }

  if (action === "reject") {
    await prisma.virgilMemoryInference.update({
      where: { id },
      data: { status: "REJECTED" },
    });
    return NextResponse.json({ ok: true, action: "rejected" });
  }

  return NextResponse.json({ message: "Unknown action." }, { status: 400 });
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string; action: string }> },
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return NextResponse.json({ message: "Access denied." }, { status: 403 });
  const owner = await prisma.user.findUnique({ where: { email: session.user.email } });
  if (!owner || owner.identity !== "OWNER") return NextResponse.json({ message: "Access denied." }, { status: 403 });

  const { id } = await params;
  const { proposedMemory } = await req.json();
  await prisma.virgilMemoryInference.update({
    where: { id },
    data: { proposedMemory, status: "EDITED" },
  });
  return NextResponse.json({ ok: true });
}
