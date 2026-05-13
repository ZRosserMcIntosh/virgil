/**
 * VIRGIL Memory — visibility rules.
 *
 * Determines whether a given identity is allowed to see a given memory row.
 * Called per-candidate during retrieval; never surfaces a reason to the caller.
 */

import type { Memory } from "@prisma/client";
import type { TrustContext } from "@/lib/virgil/types";
import { isNeverCloud } from "./types";

// Pepper-trust ordering for numeric comparison.
const PEPPER_RUNG_MAP: Record<string, number> = {
  PEPPER_BASIC:     1,
  PEPPER_TRUSTED:   2,
  PEPPER_HOUSEHOLD: 3,
  PEPPER_PRIMARY:   4,
};

// Sensitivity categories that Pepper can never access.
const PEPPER_BLOCKED_SENSITIVITIES = new Set([
  "PERSONAL_SACRED",
  "SECURITY_SECRET",
  "NEVER_SEND_TO_CLOUD",
]);

// Memory categories that Pepper can never access.
const PEPPER_BLOCKED_CATEGORIES = new Set([
  "SECURITY",
  "DECISION_JOURNAL",
  "NEVER_CLOUD",
]);

export interface VisibilityResult {
  allowed: boolean;
  reason: string;
}

export function canIdentitySeeMemory(memory: Memory, trust: TrustContext): VisibilityResult {
  const { identity, isOwner, isPepper, pepperRung, lockedDown, denied } = trust;

  // --- System gates ---
  if (lockedDown) return { allowed: false, reason: "lockdown" };
  if (denied)     return { allowed: false, reason: "denied" };

  // --- Absolute blocks ---
  if (identity === "STRANGER" || identity === "ADVERSARY") {
    return { allowed: false, reason: "identity_blocked" };
  }
  if (!trust.isAuthenticated) {
    return { allowed: false, reason: "unauthenticated" };
  }

  // --- Owner: can see everything ---
  if (isOwner) return { allowed: true, reason: "owner" };

  // --- Pepper ---
  if (isPepper) {
    if (PEPPER_BLOCKED_SENSITIVITIES.has(memory.sensitivity)) {
      return { allowed: false, reason: "pepper_sensitivity_blocked" };
    }
    if (PEPPER_BLOCKED_CATEGORIES.has(memory.category)) {
      return { allowed: false, reason: "pepper_category_blocked" };
    }
    if (memory.pepperVisibility === null) {
      return { allowed: false, reason: "pepper_not_granted" };
    }
    const required = PEPPER_RUNG_MAP[memory.pepperVisibility] ?? 99;
    if (pepperRung < required) {
      return { allowed: false, reason: "pepper_rung_insufficient" };
    }
    return { allowed: true, reason: "pepper_grant" };
  }

  // --- Delegate: project-scoped memory only ---
  if (identity === "DELEGATE") {
    if (!memory.projectId) {
      return { allowed: false, reason: "delegate_no_project" };
    }
    if (isNeverCloud(memory.sensitivity as Parameters<typeof isNeverCloud>[0])) {
      return { allowed: false, reason: "delegate_sensitivity_blocked" };
    }
    // Caller must additionally verify ScopeGrant for the project. Here we allow
    // if project is present; pipeline enforces scope grants separately.
    return { allowed: true, reason: "delegate_project" };
  }

  // --- Guest: no memory ---
  return { allowed: false, reason: "guest_no_memory" };
}
