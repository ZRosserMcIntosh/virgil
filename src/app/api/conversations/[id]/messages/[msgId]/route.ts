import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/options";
import { prisma } from "@/lib/db/client";

// PATCH /api/conversations/[id]/messages/[msgId] — update feedback
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; msgId: string }> },
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const userId = (session.user as any).id as string;
  const { id, msgId } = await params;

  // Verify ownership of parent conversation
  const conv = await (prisma as any).virgilConversation.findFirst({ where: { id, userId } });
  if (!conv) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const { feedback, feedbackNote } = await req.json();

  const updated = await (prisma as any).virgilMessage.update({
    where: { id: msgId, conversationId: id },
    data: {
      ...(feedback !== undefined && { feedback }),
      ...(feedbackNote !== undefined && { feedbackNote: String(feedbackNote).slice(0, 500) }),
    },
  });

  return NextResponse.json(updated);
}

// DELETE /api/conversations/[id]/messages/[msgId] — clear feedback
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string; msgId: string }> },
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const userId = (session.user as any).id as string;
  const { id, msgId } = await params;

  const conv = await (prisma as any).virgilConversation.findFirst({ where: { id, userId } });
  if (!conv) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await (prisma as any).virgilMessage.update({
    where: { id: msgId, conversationId: id },
    data: { feedback: null, feedbackNote: null },
  });

  return NextResponse.json({ ok: true });
}
