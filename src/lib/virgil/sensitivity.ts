/**
 * VIRGIL — Sensitivity classifier (heuristic v0).
 *
 * Lexical pre-classifier that runs locally BEFORE any cloud model sees data.
 * Designed to be cheap, conservative, and replaceable by a local LLM later.
 * "Conservative" means: when in doubt, classify HIGHER. Privacy fails closed.
 */

import type { SensitivityClassification, SensitivityLevel } from "./types";

const SECRETS_PATTERNS: RegExp[] = [
  /\b(sk-[a-z0-9]{20,}|pk_[a-z0-9]{20,})\b/i,           // openai/stripe-shaped keys
  /\b(api[_\- ]?key|secret|bearer|access[_\- ]?token)\b/i,
  /-----BEGIN [A-Z ]*PRIVATE KEY-----/,
  /\b(?:AKIA|ASIA)[A-Z0-9]{16}\b/,                      // AWS access keys
  /\bgithub_pat_[A-Za-z0-9_]+\b/,
  /\bxox[abprs]-[A-Za-z0-9-]+\b/,                        // slack
  /\bAIza[0-9A-Za-z_-]{35}\b/,                           // google
];

const SECURITY_PATTERNS: RegExp[] = [
  /\bpassword\b/i,
  /\bmfa|2fa|otp\b/i,
  /\bssh\b/i,
  /\bdeploy(ment)? key\b/i,
];

const PERSONAL_SACRED_PATTERNS: RegExp[] = [
  /\bfamily\b/i,
  /\b(?:my )?(mom|mother|dad|father|brother|sister|son|daughter|wife|husband|partner)\b/i,
  /\b(?:therap(?:y|ist)|grief|funeral|diagnosis|hospital)\b/i,
];

const PERSONAL_PRIVATE_PATTERNS: RegExp[] = [
  /\b(?:personal|private|relationship|dating)\b/i,
  /\b(?:girlfriend|boyfriend|ex)\b/i,
];

const BUSINESS_CONFIDENTIAL_PATTERNS: RegExp[] = [
  /\b(?:revenue|payroll|salary|valuation|cap table|term sheet|due diligence)\b/i,
  /\b(?:client list|customer list|investor)\b/i,
  /\b(?:contract|nda|legal)\b/i,
];

const BUSINESS_INTERNAL_PATTERNS: RegExp[] = [
  /\b(katura|k99|maverick|yen)\b/i,
  /\b(roadmap|architecture|deploy|repo|backlog)\b/i,
];

interface Hit {
  level: SensitivityLevel;
  reason: string;
}

const RANK: Record<SensitivityLevel, number> = {
  PUBLIC: 0,
  BUSINESS_INTERNAL: 1,
  BUSINESS_CONFIDENTIAL: 2,
  PERSONAL_PRIVATE: 3,
  PERSONAL_SACRED: 4,
  SECURITY_SECRET: 5,
  NEVER_SEND_TO_CLOUD: 6,
};

export function classifySensitivity(text: string): SensitivityClassification {
  const hits: Hit[] = [];

  if (SECRETS_PATTERNS.some((r) => r.test(text))) {
    hits.push({ level: "SECURITY_SECRET", reason: "Detected secret-shaped token." });
  }
  if (SECURITY_PATTERNS.some((r) => r.test(text))) {
    hits.push({ level: "SECURITY_SECRET", reason: "Detected security keyword (password/MFA/SSH/etc.)." });
  }
  if (PERSONAL_SACRED_PATTERNS.some((r) => r.test(text))) {
    hits.push({ level: "PERSONAL_SACRED", reason: "Detected personal-sacred reference (family/health/therapy)." });
  }
  if (PERSONAL_PRIVATE_PATTERNS.some((r) => r.test(text))) {
    hits.push({ level: "PERSONAL_PRIVATE", reason: "Detected personal-private reference." });
  }
  if (BUSINESS_CONFIDENTIAL_PATTERNS.some((r) => r.test(text))) {
    hits.push({ level: "BUSINESS_CONFIDENTIAL", reason: "Detected confidential business term." });
  }
  if (BUSINESS_INTERNAL_PATTERNS.some((r) => r.test(text))) {
    hits.push({ level: "BUSINESS_INTERNAL", reason: "Detected internal project reference." });
  }

  if (hits.length === 0) {
    return {
      level: "PUBLIC",
      cloudAllowed: true,
      requiresRedaction: false,
      neverSendToCloud: false,
      reason: "No sensitive markers detected.",
      confidence: 0.5,
    };
  }

  // Take the highest-rank hit. Privacy fails closed.
  const top = hits.reduce((a, b) => (RANK[a.level] >= RANK[b.level] ? a : b));
  return {
    level: top.level,
    cloudAllowed: cloudAllowedFor(top.level),
    requiresRedaction: requiresRedactionFor(top.level),
    neverSendToCloud: top.level === "SECURITY_SECRET" || top.level === "NEVER_SEND_TO_CLOUD",
    reason: top.reason,
    confidence: 0.7,
  };
}

export function cloudAllowedFor(level: SensitivityLevel): boolean {
  switch (level) {
    case "PUBLIC":
    case "BUSINESS_INTERNAL":
      return true;
    case "BUSINESS_CONFIDENTIAL":
    case "PERSONAL_PRIVATE":
      return true; // allowed only after redaction
    case "PERSONAL_SACRED":
    case "SECURITY_SECRET":
    case "NEVER_SEND_TO_CLOUD":
      return false;
  }
}

export function requiresRedactionFor(level: SensitivityLevel): boolean {
  return level === "BUSINESS_CONFIDENTIAL" || level === "PERSONAL_PRIVATE";
}
