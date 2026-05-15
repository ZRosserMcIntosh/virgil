/**
 * GET /api/veronica/auth/status
 *
 * Returns whether Stella's PEPPER account has been onboarded.
 * No auth required — this is checked BEFORE login.
 */

import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/client";

export const dynamic = "force-dynamic";

export async function GET() {
  const stellaEmail = process.env.VERONICA_PRINCIPAL_EMAIL;
  if (!stellaEmail) {
    return NextResponse.json({ onboarded: false, configured: false });
  }

  const user = await prisma.user.findUnique({
    where: { email: stellaEmail.toLowerCase().trim() },
    select: { veronicaOnboarded: true },
  });

  if (!user) {
    return NextResponse.json({ onboarded: false, configured: true });
  }

  return NextResponse.json({ onboarded: user.veronicaOnboarded, configured: true });
}
