/**
 * VIRGIL — Companion-aware principal resolver.
 *
 * Fix 0.1: For Virgil, the principal is the OWNER.
 * For Verônica, the principal is the PEPPER.
 * This ensures trust.isOwner isn't accidentally used as
 * Verônica's principal identity.
 */

import type { TrustContext } from "@/lib/virgil/types";

export type CompanionId = "VIRGIL" | "VERONICA";

/**
 * Returns true if the current session holder is the rightful principal
 * for the given companion.
 */
export function isPrincipal(companion: CompanionId, trust: TrustContext): boolean {
  if (companion === "VIRGIL") return trust.isOwner;
  if (companion === "VERONICA") return trust.isPepper;
  return false;
}

/**
 * Returns the authorization label for logging/UI purposes.
 */
export function principalLabel(companion: CompanionId, trust: TrustContext): string {
  if (companion === "VIRGIL" && trust.isOwner) return "OWNER";
  if (companion === "VERONICA" && trust.isPepper) return "PEPPER";
  if (trust.isAuthenticated) return trust.identity;
  return "STRANGER";
}
