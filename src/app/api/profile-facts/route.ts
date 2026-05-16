import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/options";
import { prisma } from "@/lib/db/client";
import { ProfileSubject } from "@prisma/client";

// ── GET /api/profile-facts?subject=ROSSER|STELLA ──────────────────────────
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const subject = req.nextUrl.searchParams.get("subject") as ProfileSubject | null;
  const where = subject ? { subject } : {};

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

  const body = await req.json();
  const { subject, category, label, value, veronicaVisible, pinned, encrypted } = body;

  if (!subject || !category || !label || value === undefined) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
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
