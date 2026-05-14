/**
 * VIRGIL — Auth diagnostic endpoint (temporary).
 * Remove after login is confirmed working.
 */
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/client";

export async function GET() {
  const checks: Record<string, string> = {};

  // 1. Env vars present?
  checks.NEXTAUTH_SECRET = process.env.NEXTAUTH_SECRET ? "set" : "MISSING";
  checks.NEXTAUTH_URL = process.env.NEXTAUTH_URL ?? "MISSING";
  checks.VIRGIL_OWNER_EMAIL = process.env.VIRGIL_OWNER_EMAIL ?? "MISSING";
  checks.VIRGIL_OWNER_PASSWORD = process.env.VIRGIL_OWNER_PASSWORD ? "set" : "MISSING";
  checks.DATABASE_URL = process.env.DATABASE_URL ? "set" : "MISSING";

  // 2. DB reachable?
  try {
    await prisma.$queryRaw`SELECT 1`;
    checks.db_connection = "ok";
  } catch (e) {
    checks.db_connection = `FAILED: ${String(e).slice(0, 120)}`;
  }

  // 3. Owner row exists?
  try {
    const ownerEmail = process.env.VIRGIL_OWNER_EMAIL;
    if (ownerEmail) {
      const user = await prisma.user.findUnique({ where: { email: ownerEmail } });
      checks.owner_row = user
        ? `found — identity=${user.identity} suspended=${user.suspended}`
        : "NOT FOUND";
    } else {
      checks.owner_row = "skipped — no email env var";
    }
  } catch (e) {
    checks.owner_row = `FAILED: ${String(e).slice(0, 120)}`;
  }

  return NextResponse.json(checks);
}
