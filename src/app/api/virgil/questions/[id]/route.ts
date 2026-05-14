import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/options";
import { prisma } from "@/lib/db/client";
import { callProvider } from "@/lib/virgil/provider-adapter";

export const dynamic = "force-dynamic";

// POST /api/virgil/questions/[id]/answer
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return NextResponse.json({ message: "Access denied." }, { status: 403 });
  const owner = await prisma.user.findUnique({ where: { email: session.user.email } });
  if (!owner || owner.identity !== "OWNER") return NextResponse.json({ message: "Access denied." }, { status: 403 });

  const { id } = await params;
  const { answer, generateFollowups = false } = await req.json();
  if (!answer?.trim()) return NextResponse.json({ message: "Answer required." }, { status: 400 });

  const question = await prisma.virgilQuestion.findUnique({
    where: { id },
  });

  if (!question) return NextResponse.json({ message: "Question not found." }, { status: 404 });

  // Save answer
  const savedAnswer = await prisma.virgilQuestionAnswer.create({
    data: {
      questionId: id,
      userId: owner.id,
      answer: answer.trim(),
    },
  });

  // Mark question answered
  await prisma.virgilQuestion.update({
    where: { id },
    data: { status: "ANSWERED", answeredAt: new Date() },
  });

  // Generate memory inferences via LLM
  let inferences: Array<{ proposedMemory: string; category: string; confidence: number; sensitivity: string; reason: string }> = [];
  try {
    const inferencePrompt = `You are Virgil's memory extraction system.

Given the question and Rosser's answer, extract only durable information that will help Virgil serve Rosser better in future conversations.

Rules:
- Do not save temporary moods.
- Do not save speculation.
- Do not exaggerate or infer more than the answer supports.
- Return only memories that will materially improve future counsel.
- Return an empty array if there is nothing durable to save.

Question: ${question.question}

Answer: ${answer}

Return ONLY a JSON array. Each item must have:
- proposedMemory (string)
- category (string: identity|values|faith|family|relationships|business|health|legal|finance|communication_style|long_term_goals|boundaries|decision_rules)
- confidence (number 0-1)
- sensitivity (string: LOW|MEDIUM|HIGH|SACRED)
- reason (string: one sentence explaining why this is worth saving)`;

    const result = await callProvider({
      provider: "anthropic",
      model: "claude-3-5-haiku-20241022",
      messages: [{ role: "user", content: inferencePrompt }],
      temperature: 0.2,
      maxTokens: 800,
    });

    const raw = result.text.trim();
    const jsonMatch = raw.match(/\[[\s\S]*\]/);
    if (jsonMatch) inferences = JSON.parse(jsonMatch[0]);
  } catch {
    // Non-blocking — answer is saved regardless
  }

  // Persist inferences
  if (inferences.length > 0) {
    await prisma.virgilMemoryInference.createMany({
      data: inferences.map((inf) => ({
        userId: owner.id,
        questionId: id,
        answerId: savedAnswer?.id,
        proposedMemory: inf.proposedMemory,
        category: inf.category,
        confidence: Math.min(1, Math.max(0, inf.confidence)),
        sensitivity: (["LOW", "MEDIUM", "HIGH", "SACRED"].includes(inf.sensitivity) ? inf.sensitivity : "MEDIUM") as never,
        inferenceReason: inf.reason,
        status: "PENDING_REVIEW",
      })),
    });
  }

  // Generate follow-up questions
  let followups: Array<{ question: string; reason: string; domain: string; priority: number; emotionalWeight: string; timing: string }> = [];
  if (generateFollowups) {
    try {
      const followupPrompt = `You are Virgil's adaptive question engine.

Generate up to 3 useful follow-up questions based on Rosser's answer. Rules:
- Questions must help Virgil serve Rosser better.
- Do not repeat the original question.
- Make each question more specific than the original.
- Return ONLY a JSON array with fields: question, reason, domain, priority (1-10), emotionalWeight (LIGHT|MODERATE|HEAVY), timing (ANYTIME|QUIET_MOMENT|EXPLICIT_PERSONAL_MODE).

Original domain: ${question.domain}
Original question: ${question.question}
Answer: ${answer}`;

      const result = await callProvider({
        provider: "anthropic",
        model: "claude-3-5-haiku-20241022",
        messages: [{ role: "user", content: followupPrompt }],
        temperature: 0.3,
        maxTokens: 600,
      });

      const raw = result.text.trim();
      const jsonMatch = raw.match(/\[[\s\S]*\]/);
      if (jsonMatch) followups = JSON.parse(jsonMatch[0]);

      if (followups.length > 0) {
        await (prisma.virgilQuestion as any).createMany({
          data: followups.slice(0, 3).map((fq) => ({
            userId: owner.id,
            domain: fq.domain ?? question.domain,
            question: fq.question,
            reason: fq.reason,
            priority: fq.priority ?? 5,
            emotionalWeight: fq.emotionalWeight ?? "LIGHT",
            timing: fq.timing ?? "ANYTIME",
            status: "UNASKED",
            generatedBy: "VIRGIL",
          })),
        });
      }
    } catch {
      // Non-blocking
    }
  }

  return NextResponse.json({
    answerId: savedAnswer?.id,
    inferences,
    followupsGenerated: followups.length,
  });
}

// PATCH /api/virgil/questions/[id]/answer — update status
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return NextResponse.json({ message: "Access denied." }, { status: 403 });
  const owner = await prisma.user.findUnique({ where: { email: session.user.email } });
  if (!owner || owner.identity !== "OWNER") return NextResponse.json({ message: "Access denied." }, { status: 403 });

  const { id } = await params;
  const { status } = await req.json();
  const valid = ["UNASKED", "ASKED", "ANSWERED", "DEFERRED", "RETIRED"];
  if (!valid.includes(status)) return NextResponse.json({ message: "Invalid status." }, { status: 400 });

  await (prisma.virgilQuestion as any).update({
    where: { id },
    data: { status },
  });

  return NextResponse.json({ ok: true });
}
