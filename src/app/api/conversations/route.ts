import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/options";
import { prisma } from "@/lib/db/client";

// GET /api/conversations?companion=VIRGIL
export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const userId = (session.user as any).id as string;

  const { searchParams } = new URL(req.url);
  const companion = searchParams.get("companion") ?? "VIRGIL";

  const conversations = await prisma.virgilConversation.findMany({
    where: { userId, companion },
    orderBy: { updatedAt: "desc" },
    take: 50,
    select: {
      id: true,
      title: true,
      companion: true,
      createdAt: true,
      updatedAt: true,
      _count: { select: { messages: true } },
    },
  });

  return NextResponse.json(conversations);
}

// POST /api/conversations
export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const userId = (session.user as any).id as string;

  const { title, companion } = await req.json();

  const conv = await prisma.virgilConversation.create({
    data: {
      userId,
      companion: companion ?? "VIRGIL",
      title: title ? String(title).slice(0, 80) : null,
    },
  });

  return NextResponse.json(conv, { status: 201 });
}
