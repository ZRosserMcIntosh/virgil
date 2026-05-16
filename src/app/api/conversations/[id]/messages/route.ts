import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/options";
import { prisma } from "@/lib/db/client";

// GET /api/conversations/[id]/messages
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const userId = (session.user as any).id as string;
  const { id } = await params;

  // Verify ownership
  const conv = await (prisma as any).virgilConversation.findFirst({ where: { id, userId } });
  if (!conv) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const messages = await (prisma as any).virgilMessage.findMany({
    where: { conversationId: id },
    orderBy: { createdAt: "asc" },
  });

  return NextResponse.json(messages);
}

// POST /api/conversations/[id]/messages — save one or more messages
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const userId = (session.user as any).id as string;
  const { id } = await params;

  const conv = await (prisma as any).virgilConversation.findFirst({ where: { id, userId } });
  if (!conv) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = await req.json();
  // Accepts either a single message object or an array
  const items: Array<{ role: string; content: string; meta?: object }> = Array.isArray(body)
    ? body
    : [body];

  const created = await (prisma as any).virgilMessage.createMany({
    data: items.map((m) => ({
      conversationId: id,
      role: m.role,
      content: m.content,
      meta: m.meta ?? null,
    })),
  });

  // Touch conversation updatedAt
  await (prisma as any).virgilConversation.update({
    where: { id },
    data: { updatedAt: new Date() },
  });

  return NextResponse.json({ count: created.count }, { status: 201 });
}
