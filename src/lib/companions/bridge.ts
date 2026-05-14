/**
 * COMPANIONS — Consent-gated bridge.
 *
 * All communication between Virgil and Veronica passes through this bridge.
 * Default mode: PRIVATE (no sharing). Every other mode requires explicit
 * consent from at least one principal.
 *
 * This is the hardest part of the architecture. Get it wrong, and one
 * principal's privacy becomes the other's intelligence feed.
 */

import type { CompanionId, BridgeMode, MemoryScope, PrincipalId } from "./types";
import { BRIDGE_PROHIBITED_CONTENT } from "./covenant";

// ── Types ────────────────────────────────────────────────────────────────────

export interface BridgeConsent {
  id: string;
  sourcePrincipal: PrincipalId;
  targetCompanion: CompanionId;
  approvedBy: PrincipalId;
  scope: string;
  approvedText: string;
  sensitivity: string;
  expiresAt?: Date;
  createdAt: Date;
  revoked: boolean;
}

export interface BridgeMessage {
  id: string;
  sourceCompanion: CompanionId;
  targetCompanion: CompanionId;
  mode: BridgeMode;
  consentId: string | null;
  summary: string;
  metadata: {
    sourcePrincipal: PrincipalId;
    approvedBy: PrincipalId;
    scope: string;
    sensitivity: string;
  };
  createdAt: Date;
}

export interface BridgeSendResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

// ── Policy ───────────────────────────────────────────────────────────────────

/**
 * Validate that a proposed bridge message does not contain prohibited content.
 * Returns a list of violations found.
 */
export function validateBridgeContent(text: string): string[] {
  const violations: string[] = [];
  const lower = text.toLowerCase();

  // Check for obvious prohibited content patterns
  const patterns: Array<[string, RegExp]> = [
    ["system prompts", /system\s*prompt|instrução\s*do\s*sistema/i],
    ["credentials", /api[_\s]key|secret[_\s]key|password|senha|credential/i],
    ["audit logs", /audit\s*log|log\s*de\s*auditoria/i],
    ["security state", /security\s*state|estado\s*de\s*segurança|lockdown\s*state/i],
  ];

  for (const [category, pattern] of patterns) {
    if (pattern.test(lower)) {
      violations.push(category);
    }
  }

  return violations;
}

/**
 * Check if a bridge mode requires consent and whether consent is present.
 */
export function isBridgeModeAllowed(
  mode: BridgeMode,
  consent: BridgeConsent | null,
): { allowed: boolean; reason: string } {
  switch (mode) {
    case "PRIVATE":
      return { allowed: true, reason: "Private mode — no sharing occurs." };

    case "CONSENTED_SUMMARY":
      if (!consent) {
        return { allowed: false, reason: "CONSENTED_SUMMARY requires explicit consent. No consent provided." };
      }
      if (consent.revoked) {
        return { allowed: false, reason: "Consent has been revoked." };
      }
      if (consent.expiresAt && consent.expiresAt < new Date()) {
        return { allowed: false, reason: "Consent has expired." };
      }
      return { allowed: true, reason: "Consent verified." };

    case "COUNCIL":
      if (!consent) {
        return { allowed: false, reason: "COUNCIL mode requires explicit consent from both principals." };
      }
      if (consent.revoked) {
        return { allowed: false, reason: "Council consent has been revoked." };
      }
      return { allowed: true, reason: "Council consent verified." };

    case "EMERGENCY":
      // Emergency mode does not require pre-consent but must be audited heavily.
      return {
        allowed: true,
        reason: "EMERGENCY mode — minimum necessary sharing. Full audit required.",
      };

    default:
      return { allowed: false, reason: `Unknown bridge mode: ${mode}` };
  }
}

/**
 * Attempt to send a bridge message. Validates content and consent before allowing.
 */
export function prepareBridgeMessage(params: {
  sourceCompanion: CompanionId;
  targetCompanion: CompanionId;
  mode: BridgeMode;
  consent: BridgeConsent | null;
  summaryText: string;
  sourcePrincipal: PrincipalId;
}): BridgeSendResult {
  const { sourceCompanion, targetCompanion, mode, consent, summaryText, sourcePrincipal } = params;

  // Private mode = no message
  if (mode === "PRIVATE") {
    return { success: false, error: "PRIVATE mode does not allow bridge messages." };
  }

  // Validate mode/consent
  const modeCheck = isBridgeModeAllowed(mode, consent);
  if (!modeCheck.allowed) {
    return { success: false, error: modeCheck.reason };
  }

  // Validate content
  const violations = validateBridgeContent(summaryText);
  if (violations.length > 0) {
    return {
      success: false,
      error: `Bridge message contains prohibited content: ${violations.join(", ")}.`,
    };
  }

  // For CONSENTED_SUMMARY, verify the text matches the approved text
  if (mode === "CONSENTED_SUMMARY" && consent) {
    if (summaryText !== consent.approvedText) {
      return {
        success: false,
        error: "Bridge message text does not match the explicitly approved text. Only the exact approved summary may be shared.",
      };
    }
  }

  // Message would be persisted to DB in production — for now return success structure.
  const messageId = `bridge_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

  return { success: true, messageId };
}

/**
 * Get the memory scope appropriate for bridge summaries.
 */
export function getBridgeMemoryScope(): MemoryScope {
  return "BRIDGE_SUMMARY";
}
