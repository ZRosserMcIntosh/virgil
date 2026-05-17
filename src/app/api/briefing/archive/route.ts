/**
 * POST /api/briefing/archive — save the current briefing to the archive
 * GET  /api/briefing/archive — list past briefings
 */

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/options";
import { prisma } from "@/lib/db/client";
import { generateBriefing } from "@/lib/virgil/briefing";

export async function POST() {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const userId = (session.user as any).id as string;

  const briefing = await generateBriefing(userId);
  const archived = await (prisma as any).briefingArchive.create({
    data: { userId, content: briefing },
  });

  return NextResponse.json(archived, { status: 201 });
}

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const userId = (session.user as any).id as string;

  const archives = await (prisma as any).briefingArchive.findMany({
    where: { userId },
    orderBy: { generatedAt: "desc" },
    take: 30,
  });

  return NextResponse.json(archives);
}
