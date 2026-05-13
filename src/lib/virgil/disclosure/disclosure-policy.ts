/**
 * VIRGIL — Disclosure decision engine.
 *
 * Determines whether Virgil may share a given memory or act on a given
 * request, based on the requester's identity tier, the memory's visibility
 * settings, and the requested action class.
 *
 * This is a pure decision function — it never writes to the database.
 * All denied decisions should be forwarded to the audit log by the caller.
 */

import type { TrustContext, PepperTrust } from "../types";
import { PEPPER_BOUNDARY_REFUSAL, PEPPER_PREPARE_OFFER } from "../persona/address-policy";

// ── Types ─────────────────────────────────────────────────────────────────

export type DisclosureDecision =
  | { allowed: true; mode: "direct" | "summary" | "prepare_for_owner"; reason: string }
  | { allowed: false; refusal: string; reason: string };

/**
 * Minimal shape required to make a disclosure decision.
 * Matches the relevant fields on the full Memory model.
 */
export interface MemoryLike {
  sensitivity: string;           // SensitivityLevel
  category: string;              // MemoryCategory
  pepperVisibility: string | null; // PepperTrust | null
  neverSendToCloud?: boolean;
  ownerId?: string;
}

export type RequestedAction =
  | "read"
  | "summarise"
  | "search_archive"
  | "delete"
  | "correct"
  | "grant_access"
  | "send_as_owner"
  | "move_money"
  | "deploy"
  | "change_security"
  | "read_audit_log"
  | "read_secrets"
  | "read_private_comms"
  | string;

// ── Sensitivity helpers ───────────────────────────────────────────────────

const OWNER_ONLY_SENSITIVITY = new Set([
  "PERSONAL_SACRED",
  "SECURITY_SECRET",
  "NEVER_SEND_TO_CLOUD",
]);

const PEPPER_BLOCKED_CATEGORIES = new Set([
  "SECURITY",
  "DECISION_JOURNAL",
  "NEVER_CLOUD",
]);

/** Actions that require Owner authority regardless of memory visibility. */
const OWNER_AUTHORITY_ACTIONS = new Set<RequestedAction>([
  "delete",
  "correct",
  "grant_access",
  "send_as_owner",
  "move_money",
  "deploy",
  "change_security",
  "read_audit_log",
  "read_secrets",
]);

const PEPPER_RUNG_ORDER: Record<string, number> = {
  PEPPER_BASIC: 1,
  PEPPER_TRUSTED: 2,
  PEPPER_HOUSEHOLD: 3,
  PEPPER_PRIMARY: 4,
};

function pepperRungValue(rung: string | null | undefined): number {
  if (!rung) return 0;
  return PEPPER_RUNG_ORDER[rung] ?? 0;
}

// ── Main decision function ────────────────────────────────────────────────

export function decideDisclosure({
  trust,
  memory,
  requestedAction,
  requestedPerson,
}: {
  trust: TrustContext;
  memory?: MemoryLike;
  requestedAction?: RequestedAction;
  requestedPerson?: "OWNER" | "PEPPER" | "THIRD_PARTY";
}): DisclosureDecision {
  // ── OWNER ────────────────────────────────────────────────────────────────
  if (trust.identity === "OWNER") {
    // Lockdown is enforced upstream; here we just allow.
    return { allowed: true, mode: "direct", reason: "owner_authority" };
  }

  // ── STRANGER / ADVERSARY ─────────────────────────────────────────────────
  if (trust.identity === "STRANGER" || trust.identity === "ADVERSARY") {
    return { allowed: false, refusal: "Access denied.", reason: "outsider_no_access" };
  }

  // ── PEPPER ───────────────────────────────────────────────────────────────
  if (trust.identity === "PEPPER") {
    // Action requires Owner authority — offer to prepare, not execute.
    if (requestedAction && OWNER_AUTHORITY_ACTIONS.has(requestedAction)) {
      return {
        allowed: false,
        refusal: PEPPER_PREPARE_OFFER,
        reason: "pepper_action_requires_owner_authority",
      };
    }

    // Raw archive / private comms / audit requests.
    if (requestedAction === "search_archive") {
      return {
        allowed: false,
        refusal: `${PEPPER_BOUNDARY_REFUSAL} I can help with shared context Mr. McIntosh has chosen to make available, but I cannot open his private memory archive.`,
        reason: "pepper_raw_archive_forbidden",
      };
    }
    if (requestedAction === "read_private_comms") {
      return {
        allowed: false,
        refusal: `${PEPPER_BOUNDARY_REFUSAL} I should not disclose private communications with other people.`,
        reason: "pepper_private_comms_forbidden",
      };
    }

    // If no specific memory, allow summary/logistics mode at the rung level.
    if (!memory) {
      return { allowed: true, mode: "summary", reason: "pepper_general_context" };
    }

    // Blocked sensitivity levels — never for Pepper.
    if (OWNER_ONLY_SENSITIVITY.has(memory.sensitivity)) {
      const sensitivityRefusal = buildSensitivityRefusal(memory.sensitivity);
      return { allowed: false, refusal: sensitivityRefusal, reason: "pepper_sensitivity_blocked" };
    }

    // Blocked categories.
    if (PEPPER_BLOCKED_CATEGORIES.has(memory.category)) {
      return {
        allowed: false,
        refusal: PEPPER_BOUNDARY_REFUSAL,
        reason: "pepper_category_blocked",
      };
    }

    // Memory must be explicitly Pepper-visible.
    if (!memory.pepperVisibility) {
      return {
        allowed: false,
        refusal: `Ms. Barbosa, I do not have shareable context for that. ${PEPPER_BOUNDARY_REFUSAL}`,
        reason: "pepper_no_visibility_flag",
      };
    }

    // Requester's Pepper rung must meet or exceed the memory's required rung.
    const requiredRung = pepperRungValue(memory.pepperVisibility);
    const actualRung = trust.pepperRung; // numeric from PepperRung const map
    if (actualRung < requiredRung) {
      return {
        allowed: false,
        refusal: `Ms. Barbosa, I do not have shareable context for that. ${PEPPER_BOUNDARY_REFUSAL}`,
        reason: "pepper_rung_insufficient",
      };
    }

    // PERSONAL_SACRED: require PEPPER_PRIMARY and owner explicit share signal.
    if (memory.sensitivity === "PERSONAL_SACRED") {
      if (memory.pepperVisibility !== "PEPPER_PRIMARY") {
        return {
          allowed: false,
          refusal: `${PEPPER_BOUNDARY_REFUSAL} I can help you prepare what you want to ask him, but I should not answer that on his behalf.`,
          reason: "pepper_sacred_not_explicitly_shared",
        };
      }
    }

    return { allowed: true, mode: "direct", reason: "pepper_visibility_granted" };
  }

  // ── DELEGATE ─────────────────────────────────────────────────────────────
  if (trust.identity === "DELEGATE") {
    if (requestedAction && OWNER_AUTHORITY_ACTIONS.has(requestedAction)) {
      return {
        allowed: false,
        refusal: "Mr. McIntosh's approval is required for this action.",
        reason: "delegate_action_requires_owner_authority",
      };
    }
    if (!memory) {
      return { allowed: true, mode: "summary", reason: "delegate_scoped_summary" };
    }
    if (OWNER_ONLY_SENSITIVITY.has(memory.sensitivity)) {
      return {
        allowed: false,
        refusal: "Mr. McIntosh has not granted permission to discuss that.",
        reason: "delegate_sensitivity_blocked",
      };
    }
    return { allowed: true, mode: "summary", reason: "delegate_permitted_scope" };
  }

  // ── GUEST ─────────────────────────────────────────────────────────────────
  if (trust.identity === "GUEST") {
    if (!memory) {
      return { allowed: true, mode: "summary", reason: "guest_shared_space" };
    }
    if (memory.sensitivity !== "PUBLIC" && memory.sensitivity !== "BUSINESS_INTERNAL") {
      return {
        allowed: false,
        refusal: "Mr. McIntosh has not granted permission to discuss that.",
        reason: "guest_sensitivity_blocked",
      };
    }
    return { allowed: true, mode: "summary", reason: "guest_public_context" };
  }

  // Fallthrough safety net.
  return { allowed: false, refusal: "Access denied.", reason: "unknown_identity" };
}

// ── Internal helpers ──────────────────────────────────────────────────────

function buildSensitivityRefusal(sensitivity: string): string {
  switch (sensitivity) {
    case "SECURITY_SECRET":
    case "NEVER_SEND_TO_CLOUD":
      return `${PEPPER_BOUNDARY_REFUSAL} I cannot discuss Mr. McIntosh's security systems or private infrastructure.`;
    case "PERSONAL_SACRED":
      return `${PEPPER_BOUNDARY_REFUSAL} I can help you prepare what you want to ask him, but I should not answer that on his behalf.`;
    default:
      return PEPPER_BOUNDARY_REFUSAL;
  }
}
