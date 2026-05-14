/**
 * COMPANIONS — shared type definitions.
 *
 * Two companions. Two principals. One covenant.
 * Virgil belongs to Rosser. Veronica belongs to Stella.
 * PEPPER is Stella inside Virgil's world — a separate concept entirely.
 */

export type CompanionId = "VIRGIL" | "VERONICA";

export type PrincipalId = "ROSSER" | "STELLA";

export interface PrincipalProfile {
  id: PrincipalId;
  companionId: CompanionId;
  displayName: string;
  formalAddress: string;
  directAddress: string;
  defaultLanguage: string;
  email?: string;
}

export const PRINCIPALS: Record<PrincipalId, PrincipalProfile> = {
  ROSSER: {
    id: "ROSSER",
    companionId: "VIRGIL",
    displayName: "Rosser McIntosh",
    formalAddress: "Mr. McIntosh",
    directAddress: "Sir",
    defaultLanguage: "en",
    email: process.env.VIRGIL_OWNER_EMAIL,
  },
  STELLA: {
    id: "STELLA",
    companionId: "VERONICA",
    displayName: "Stella Barbosa",
    formalAddress: "Ms. Barbosa",
    directAddress: "Stella",
    defaultLanguage: "pt-BR",
    email: process.env.VERONICA_PRINCIPAL_EMAIL,
  },
} as const;

export interface CompanionProfile {
  id: CompanionId;
  principalId: PrincipalId;
  name: string;
  defaultLanguage: string;
  domain: string;
  description: string;
}

export const COMPANIONS: Record<CompanionId, CompanionProfile> = {
  VIRGIL: {
    id: "VIRGIL",
    principalId: "ROSSER",
    name: "Virgil",
    defaultLanguage: "en",
    domain: process.env.VIRGIL_DOMAIN ?? "virgil.zrossermcintosh.com",
    description: "Private command intelligence for Rosser McIntosh.",
  },
  VERONICA: {
    id: "VERONICA",
    principalId: "STELLA",
    name: "Veronica",
    defaultLanguage: "pt-BR",
    domain: process.env.VERONICA_DOMAIN ?? "veronica.zrossermcintosh.com",
    description: "Companheira de inteligência privada para Stella Barbosa.",
  },
} as const;

/** Memory scope — hard privacy boundary. */
export type MemoryScope =
  | "VIRGIL_PRIVATE"
  | "VERONICA_PRIVATE"
  | "SHARED_EXPLICIT"
  | "BRIDGE_SUMMARY"
  | "EMERGENCY_MINIMAL";

/** Bridge communication mode between companions. */
export type BridgeMode =
  | "PRIVATE"
  | "CONSENTED_SUMMARY"
  | "COUNCIL"
  | "EMERGENCY";

/** Sensitivity tiers for Stella-private information (mirrors Virgil's). */
export type VeronicaSensitivityLevel =
  | "PUBLIC"
  | "PERSONAL_PRIVATE"
  | "PERSONAL_SACRED"
  | "NEVER_DISCLOSE";

/**
 * Resolve which companion owns a given domain.
 */
export function resolveCompanionFromHost(hostname: string): CompanionId {
  const veronicaDomain = COMPANIONS.VERONICA.domain;
  if (hostname === veronicaDomain || hostname.startsWith("veronica")) {
    return "VERONICA";
  }
  return "VIRGIL";
}

/**
 * Get the principal who owns a companion.
 */
export function getPrincipalForCompanion(companionId: CompanionId): PrincipalProfile {
  return PRINCIPALS[COMPANIONS[companionId].principalId];
}

/**
 * Check whether a companion may access a given memory scope.
 */
export function canCompanionAccessScope(
  companionId: CompanionId,
  scope: MemoryScope,
): boolean {
  switch (scope) {
    case "VIRGIL_PRIVATE":
      return companionId === "VIRGIL";
    case "VERONICA_PRIVATE":
      return companionId === "VERONICA";
    case "SHARED_EXPLICIT":
      return true;
    case "BRIDGE_SUMMARY":
      return true;
    case "EMERGENCY_MINIMAL":
      return true;
    default:
      return false;
  }
}
