/**
 * VIRGIL — Permissions / authorization ladder.
 *
 * Six rungs above the stranger floor. Every action declares the rung it
 * needs. Sensitivity raises the bar. Risk also raises the bar. Failure to
 * meet the bar produces a flat "Access denied." — never a hint about why.
 *
 * Identity gates: lockdown, denial-list, adversary, and stranger checks
 * are handled upstream in pipeline.ts. This module assumes the caller
 * has already passed those gates.
 */

import {
  PermissionLevel,
  type PermissionDecision,
  type PermissionLevelValue,
  type RiskLevel,
  type SensitivityLevel,
  type TrustContext,
} from "./types";
import { ACCESS_DENIED_MESSAGE } from "./constitution";

/** Owner-only sensitivity tiers — non-owners can never reach these. */
const OWNER_ONLY_SENSITIVITIES: SensitivityLevel[] = [
  "PERSONAL_SACRED",
  "SECURITY_SECRET",
  "NEVER_SEND_TO_CLOUD",
  "BUSINESS_CONFIDENTIAL",
  "PERSONAL_PRIVATE",
];

/** Which rung does an action need based on its sensitivity + risk? */
export function requiredLevelFor(
  sensitivity: SensitivityLevel,
  risk: RiskLevel,
): PermissionLevelValue {
  let floor: PermissionLevelValue = PermissionLevel.BASIC_AUTH;
  switch (sensitivity) {
    case "PUBLIC":
      floor = PermissionLevel.BASIC_AUTH;
      break;
    case "BUSINESS_INTERNAL":
      floor = PermissionLevel.TRUSTED_SESSION;
      break;
    case "BUSINESS_CONFIDENTIAL":
    case "PERSONAL_PRIVATE":
      floor = PermissionLevel.STRONG_VERIFIED;
      break;
    case "PERSONAL_SACRED":
      floor = PermissionLevel.EXPLICIT_APPROVAL;
      break;
    case "SECURITY_SECRET":
    case "NEVER_SEND_TO_CLOUD":
      floor = PermissionLevel.HARD_APPROVAL;
      break;
  }

  switch (risk) {
    case "LOW":
      return floor;
    case "MEDIUM":
      return Math.max(floor, PermissionLevel.STRONG_VERIFIED) as PermissionLevelValue;
    case "HIGH":
      return Math.max(floor, PermissionLevel.EXPLICIT_APPROVAL) as PermissionLevelValue;
    case "CRITICAL":
      return PermissionLevel.HARD_APPROVAL;
  }
}

export function decidePermission(
  trust: TrustContext,
  sensitivity: SensitivityLevel,
  risk: RiskLevel,
): PermissionDecision {
  const required = requiredLevelFor(sensitivity, risk);
  const current = trust.authorizationLevel;

  // Lockdown: everything denied.
  if (trust.lockedDown) {
    return {
      allowed: false,
      requiredLevel: required,
      currentLevel: current,
      reason: "System lockdown engaged.",
      requiresApproval: false,
      denialMessage: ACCESS_DENIED_MESSAGE,
    };
  }

  // Denied / adversary: no access.
  if (trust.denied || trust.identity === "ADVERSARY") {
    return {
      allowed: false,
      requiredLevel: required,
      currentLevel: current,
      reason: "Denial list match.",
      requiresApproval: false,
      denialMessage: ACCESS_DENIED_MESSAGE,
    };
  }

  // Non-owner blocked from owner-only sensitivities.
  if (!trust.isOwner && OWNER_ONLY_SENSITIVITIES.includes(sensitivity)) {
    return {
      allowed: false,
      requiredLevel: required,
      currentLevel: current,
      reason: "Owner-only sensitivity.",
      requiresApproval: false,
      denialMessage: ACCESS_DENIED_MESSAGE,
    };
  }

  // STRANGER / unauthenticated: flat deny.
  if (trust.identity === "STRANGER" || !trust.isAuthenticated) {
    return {
      allowed: false,
      requiredLevel: required,
      currentLevel: current,
      reason: "Requester is not the principal.",
      requiresApproval: false,
      denialMessage: ACCESS_DENIED_MESSAGE,
    };
  }

  // Owner rung check.
  if (trust.isOwner) {
    if (current < required) {
      const requiresApproval =
        required <= PermissionLevel.EXPLICIT_APPROVAL &&
        current >= PermissionLevel.TRUSTED_SESSION;
      return {
        allowed: false,
        requiredLevel: required,
        currentLevel: current,
        reason: `Insufficient authorization (${current}/${required}).`,
        requiresApproval,
        denialMessage: requiresApproval
          ? "I have prepared this. It requires your explicit approval before I act."
          : "Stronger verification is required for that.",
      };
    }
    return {
      allowed: true,
      requiredLevel: required,
      currentLevel: current,
      reason: "Authorized.",
      requiresApproval: false,
      denialMessage: "",
    };
  }

  // Pepper / Delegate / Guest: allowed at their rung for non-owner surfaces.
  return {
    allowed: true,
    requiredLevel: required,
    currentLevel: current,
    reason: `Authorized as ${trust.identity}.`,
    requiresApproval: false,
    denialMessage: "",
  };
}

/** Convenience for outsider-shaped responses. Always identical text. */
export function denyOutsider(): PermissionDecision {
  return {
    allowed: false,
    requiredLevel: PermissionLevel.BASIC_AUTH,
    currentLevel: PermissionLevel.STRANGER,
    reason: "Stranger.",
    requiresApproval: false,
    denialMessage: ACCESS_DENIED_MESSAGE,
  };
}
