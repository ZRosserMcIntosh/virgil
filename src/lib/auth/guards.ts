/**
 * VIRGIL — Route guard utilities.
 *
 * Fix 0.2: Server-side guards for owner-only and pepper-only routes.
 * Use in server components and API routes.
 */

import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth/options";
import { buildTrustContext } from "@/lib/auth/trust-context";
import { headers } from "next/headers";
import type { TrustContext } from "@/lib/virgil/types";

async function getTrust(): Promise<TrustContext> {
  const session = await getServerSession(authOptions);
  const h = await headers();
  return buildTrustContext({
    session,
    ip: h.get("x-forwarded-for")?.split(",")[0]?.trim() ?? undefined,
    userAgent: h.get("user-agent") ?? undefined,
  });
}

/**
 * Redirect to /login if not the owner. Use in server components.
 */
export async function requireOwner(): Promise<TrustContext> {
  const trust = await getTrust();
  if (!trust.isOwner) redirect("/login");
  return trust;
}

/**
 * Redirect to /login if not the pepper (Stella).
 */
export async function requirePepper(): Promise<TrustContext> {
  const trust = await getTrust();
  if (!trust.isPepper) redirect("/login");
  return trust;
}

/**
 * Allow either owner or pepper through.
 */
export async function requireAuthenticated(): Promise<TrustContext> {
  const trust = await getTrust();
  if (!trust.isOwner && !trust.isPepper) redirect("/login");
  return trust;
}

/**
 * Get companion from session without redirect.
 */
export async function getCompanion(): Promise<"VIRGIL" | "VERONICA"> {
  const session = await getServerSession(authOptions);
  return (session?.user as any)?.companion === "VERONICA" ? "VERONICA" : "VIRGIL";
}
