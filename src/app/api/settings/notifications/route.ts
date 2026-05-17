/**
 * GET  /api/settings/notifications
 * PATCH /api/settings/notifications
 */

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/options";
import { prisma } from "@/lib/db/client";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const userId = (session.user as any).id as string;

  const prefs = await (prisma as any).notificationPreference.findUnique({ where: { userId } });
  return NextResponse.json(prefs ?? {
    briefingEmail: false,
    deadlineAlerts: true,
    securityAlerts: true,
    prAlerts: true,
    emailDigest: false,
  });
}

export async function PATCH(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const userId = (session.user as any).id as string;
  const body = await req.json();

  const prefs = await (prisma as any).notificationPreference.upsert({
    where: { userId },
    create: { userId, ...body },
    update: body,
  });

  return NextResponse.json(prefs);
}
