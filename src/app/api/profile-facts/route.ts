import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/options";
import { prisma } from "@/lib/db/client";
import { ProfileSubject } from "@prisma/client";

// ── GET /api/profile-facts?subject=ROSSER|STELLA ──────────────────────────
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const companion = (session.user as any).companion ?? "VIRGIL";
  const isOwner = companion === "VIRGIL";

  const subject = req.nextUrl.searchParams.get("subject") as ProfileSubject | null;

  // Ownership enforcement:
  //   OWNER can read all ROSSER facts + STELLA facts marked veronicaVisible.
  //   PEPPER (Stella) can read only STELLA facts.
  let where: any = {};
  if (isOwner) {
    if (subject === "STELLA") {
      where = { subject: "STELLA", veronicaVisible: true };
    } else if (subject) {
      where = { subject };
    }
    // no filter = all ROSSER + shared STELLA
  } else {
    // Stella: only her own facts
    where = { subject: "STELLA" };
  }

  const facts = await prisma.profileFact.findMany({
    where,
    orderBy: [{ category: "asc" }, { sortOrder: "asc" }, { createdAt: "asc" }],
  });

  return NextResponse.json(facts);
}

// ── POST /api/profile-facts ───────────────────────────────────────────────
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const companion = (session.user as any).companion ?? "VIRGIL";
  const isOwner = companion === "VIRGIL";
  const body = await req.json();
  const { subject, category, label, value, veronicaVisible, pinned, encrypted } = body;

  if (!subject || !category || !label || value === undefined) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  // OWNER can create ROSSER facts. Stella can create STELLA facts.
  // Neither can create facts for the other's subject.
  if (isOwner && subject !== "ROSSER") {
    return NextResponse.json({ error: "Owner may only create ROSSER facts" }, { status: 403 });
  }
  if (!isOwner && subject !== "STELLA") {
    return NextResponse.json({ error: "You may only create STELLA facts" }, { status: 403 });
  }

  const fact = await prisma.profileFact.create({
    data: {
      subject,
      category: category.trim(),
      label:    label.trim(),
      value:    value.trim(),
      veronicaVisible: !!veronicaVisible,
      pinned:          !!pinned,
      encrypted:       !!encrypted,
    },
  });

  return NextResponse.json(fact, { status: 201 });
}
