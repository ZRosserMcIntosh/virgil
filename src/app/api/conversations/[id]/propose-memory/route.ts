import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/options";
import { prisma } from "@/lib/db/client";
import { callProvider } from "@/lib/virgil/provider-adapter";

/**
 * POST /api/conversations/[id]/propose-memory
 *
 * Reads the last N messages of a conversation and asks the model
 * whether any facts worth remembering were mentioned.
 * Returns proposed memory entries for the user to approve or dismiss.
 * Does NOT write to memory automatically — the user approves first.
 */
export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const userId = (session.user as any).id as string;
  const { id } = await params;

  const conv = await (prisma as any).virgilConversation.findFirst({ where: { id, userId } });
  if (!conv) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const messages = await (prisma as any).virgilMessage.findMany({
    where: { conversationId: id },
    orderBy: { createdAt: "asc" },
    take: 30, // last 30 messages max
  });

  if (messages.length < 2) {
    return NextResponse.json({ proposals: [] });
  }

  const transcript = messages
    .map((m: any) => `${m.role === "user" ? "Sir" : "Virgil"}: ${m.content}`)
    .join("\n");

  const system = `You are a memory extraction assistant for Virgil.
Read the conversation and identify any facts that would be worth storing as permanent memory.
Return ONLY a valid JSON array of objects with this structure:
[
  {
    "title": "short title (max 60 chars)",
    "content": "the fact or insight, 1-3 sentences",
    "category": "one of: PERSONAL, WORK, HEALTH, FINANCE, RELATIONSHIP, DECISION, GOAL, PREFERENCE, REFERENCE, STRATEGIC",
    "importance": number between 1 and 100,
    "sensitivity": "one of: PUBLIC, INTERNAL, PERSONAL_PRIVATE, CONFIDENTIAL, EYES_ONLY"
  }
]
Return an empty array [] if nothing memorable was discussed.
Do not include pleasantries, greetings, or transient session context.
Only include durable, referenceable facts or decisions.`;

  try {
    const result = await callProvider({
      provider: "openai",
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: system },
        { role: "user",   content: `Conversation:\n\n${transcript}\n\nExtract memory proposals:` },
      ],
      temperature: 0.1,
      maxTokens: 800,
    });

    let proposals: unknown[] = [];
    try {
      const raw = result.text.trim().replace(/^```json\s*/, "").replace(/\s*```$/, "");
      proposals = JSON.parse(raw);
      if (!Array.isArray(proposals)) proposals = [];
    } catch {
      proposals = [];
    }

    return NextResponse.json({ proposals: proposals.slice(0, 8) });
  } catch (err) {
    return NextResponse.json({ error: "Extraction failed", proposals: [] }, { status: 500 });
  }
}
