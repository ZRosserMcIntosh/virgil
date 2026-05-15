/**
 * GET /api/veronica/auth/status?email=xxx
 *
 * Returns whether Stella's PEPPER account has been onboarded.
 * No auth required — this is checked BEFORE login.
 *
 * Requires the email query parameter. The email must be in the
 * VERONICA_ALLOWED_EMAILS (or VERONICA_PRINCIPAL_EMAIL) env var.
 */

import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/client";
import { isStellaEmail } from "@/lib/veronica/allowed-emails";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const email = searchParams.get("email")?.trim().toLowerCase();

  if (!email) {
    return NextResponse.json({ onboarded: false, configured: false, reason: "email_required" });
  }

  if (!isStellaEmail(email)) {
    // Return the same shape as "not found" — do not reveal which emails are allowed
    return NextResponse.json({ onboarded: false, configured: false, reason: "not_recognized" });
  }

  const user = await (prisma.user as any).findUnique({
    where: { email },
    select: { veronicaOnboarded: true, identity: true },
  });

  if (!user || user.identity !== "PEPPER") {
    return NextResponse.json({ onboarded: false, configured: false, reason: "not_found" });
  }

  return NextResponse.json({ onboarded: user.veronicaOnboarded as boolean, configured: true });
}
