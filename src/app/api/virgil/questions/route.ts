import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/lib/auth/options";
import { prisma } from "@/lib/db/client";
import { STARTER_QUESTIONS } from "@/lib/virgil/questions/seed-questions";
import { DEPTH_RULES } from "@/lib/virgil/questions/types";

export const dynamic = "force-dynamic";

// GET — fetch questions
export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return NextResponse.json({ message: "Access denied." }, { status: 403 });
  const owner = await prisma.user.findUnique({ where: { email: session.user.email } });
  if (!owner || owner.identity !== "OWNER") return NextResponse.json({ message: "Access denied." }, { status: 403 });

  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status");
  const domain = searchParams.get("domain");
  const limit = parseInt(searchParams.get("limit") ?? "50");

  const questions = await prisma.virgilQuestion.findMany({
    where: {
      userId: owner.id,
      ...(status ? { status: status as never } : {}),
      ...(domain ? { domain: domain as never } : {}),
    },
    include: { answers: { orderBy: { createdAt: "desc" }, take: 1 } },
    orderBy: [{ priority: "desc" }, { createdAt: "asc" }],
    take: limit,
  });

  return NextResponse.json(questions);
}

// POST — create question or seed starter questions
export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return NextResponse.json({ message: "Access denied." }, { status: 403 });
  const owner = await prisma.user.findUnique({ where: { email: session.user.email } });
  if (!owner || owner.identity !== "OWNER") return NextResponse.json({ message: "Access denied." }, { status: 403 });

  const body = await req.json();

  // Seed starter questions if requested
  if (body.action === "seed_starters") {
    const existing = await prisma.virgilQuestion.count({ where: { userId: owner.id } });
    if (existing > 0) return NextResponse.json({ seeded: 0, message: "Already seeded." });

    const created = await prisma.virgilQuestion.createMany({
      data: STARTER_QUESTIONS.map((q) => ({
        userId: owner.id,
        domain: q.domain as never,
        question: q.question,
        reason: q.reason,
        priority: q.priority,
        emotionalWeight: q.emotionalWeight as never,
        timing: q.timing as never,
        status: "UNASKED" as never,
        generatedBy: "SYSTEM" as never,
      })),
    });
    return NextResponse.json({ seeded: created.count });
  }

  // Start a question session
  if (body.action === "start_session") {
    const { depth = "STANDARD", domain: selectedDomain } = body;
    const rules = DEPTH_RULES[depth as keyof typeof DEPTH_RULES] ?? DEPTH_RULES.STANDARD;

    const questions = await prisma.virgilQuestion.findMany({
      where: {
        userId: owner.id,
        status: { in: ["UNASKED", "ASKED"] },
        emotionalWeight: { in: rules.allowedWeights as never[] },
        ...(selectedDomain ? { domain: selectedDomain as never } : {}),
      },
      orderBy: [{ priority: "desc" }, { createdAt: "asc" }],
      take: rules.maxQuestions,
    });

    const session2 = await prisma.virgilQuestionSession.create({
      data: {
        userId: owner.id,
        depth: depth as never,
        selectedDomain: selectedDomain ?? null,
        questionIds: questions.map((q) => q.id),
        status: "ACTIVE",
      },
    });

    // Mark questions as ASKED
    await prisma.virgilQuestion.updateMany({
      where: { id: { in: questions.map((q) => q.id) } },
      data: { status: "ASKED", askedAt: new Date() },
    });

    return NextResponse.json({ session: session2, questions });
  }

  // Create a single question
  const Schema = z.object({
    domain: z.string(),
    question: z.string().min(5),
    reason: z.string(),
    priority: z.number().min(1).max(10).default(5),
    emotionalWeight: z.enum(["LIGHT", "MODERATE", "HEAVY"]).default("LIGHT"),
    timing: z.enum(["ANYTIME", "QUIET_MOMENT", "EXPLICIT_PERSONAL_MODE", "ONLY_IF_RELEVANT"]).default("ANYTIME"),
  });

  const parsed = Schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ message: "Invalid input." }, { status: 400 });

  const q = await prisma.virgilQuestion.create({
    data: {
      userId: owner.id,
      domain: parsed.data.domain as never,
      question: parsed.data.question,
      reason: parsed.data.reason,
      priority: parsed.data.priority,
      emotionalWeight: parsed.data.emotionalWeight as never,
      timing: parsed.data.timing as never,
      status: "UNASKED",
      generatedBy: "MANUAL",
    },
  });

  return NextResponse.json(q);
}
