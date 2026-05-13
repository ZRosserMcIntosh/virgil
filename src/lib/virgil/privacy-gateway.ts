/**
 * VIRGIL — Privacy gateway.
 *
 * Every external-model call passes through here. The gateway:
 *   1. Re-validates classification.
 *   2. Refuses outright when the policy forbids cloud.
 *   3. Tokenizes named entities (people, invoices, projects) into placeholders.
 *   4. Returns a redaction map the caller uses to rehydrate output for Rosser
 *      (and only for Rosser).
 *
 * This is intentionally simple in v0; the *interface* is what matters and
 * must remain stable as the redactor improves.
 */

import { classifySensitivity, cloudAllowedFor } from "./sensitivity";
import type { SensitivityClassification, SensitivityLevel } from "./types";

export interface RedactionMap {
  /** placeholder -> original */
  forward: Record<string, string>;
  /** original -> placeholder */
  reverse: Record<string, string>;
}

export interface PrivacyDecision {
  allowCloud: boolean;
  classification: SensitivityClassification;
  redacted: string;
  map: RedactionMap;
  reason: string;
}

const LOCAL_ONLY = process.env.VIRGIL_LOCAL_ONLY === "true";

// Very conservative entity sketch. A real implementation will use a local
// NER model. The point here is the *shape* of redaction.
const PERSON_NAME = /\b([A-Z][a-z]{2,})\s+([A-Z][a-z]{2,})\b/g;
const EMAIL = /\b[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}\b/g;
const PHONE = /\b(\+?\d[\d\s\-().]{7,}\d)\b/g;
const INVOICE = /\b(?:invoice|inv)[#\s-]*([A-Z0-9-]{4,})\b/gi;

export function applyRedaction(text: string): { redacted: string; map: RedactionMap } {
  const forward: Record<string, string> = {};
  const reverse: Record<string, string> = {};
  let counters = { person: 0, email: 0, phone: 0, invoice: 0 };

  const stamp = (kind: string, original: string): string => {
    if (reverse[original]) return reverse[original]!;
    const idx = String(++counters[kind as keyof typeof counters]).padStart(3, "0");
    const placeholder = `${kind.toUpperCase()}_${idx}`;
    forward[placeholder] = original;
    reverse[original] = placeholder;
    return placeholder;
  };

  let redacted = text;
  redacted = redacted.replace(EMAIL, (m) => stamp("email", m));
  redacted = redacted.replace(PHONE, (m) => stamp("phone", m));
  redacted = redacted.replace(INVOICE, (m) => stamp("invoice", m));
  redacted = redacted.replace(PERSON_NAME, (m) => stamp("person", m));

  return { redacted, map: { forward, reverse } };
}

/** Reverse the placeholders. Only call for Rosser-bound output. */
export function rehydrate(text: string, map: RedactionMap): string {
  let out = text;
  for (const [placeholder, original] of Object.entries(map.forward)) {
    // word-boundary safe replace
    out = out.split(placeholder).join(original);
  }
  return out;
}

export function classifyAndPrepareForCloud(input: string): PrivacyDecision {
  const classification = classifySensitivity(input);

  if (LOCAL_ONLY) {
    return {
      allowCloud: false,
      classification,
      redacted: input,
      map: { forward: {}, reverse: {} },
      reason: "VIRGIL_LOCAL_ONLY=true — cloud disabled by policy.",
    };
  }

  if (classification.neverSendToCloud || !cloudAllowedFor(classification.level)) {
    return {
      allowCloud: false,
      classification,
      redacted: input,
      map: { forward: {}, reverse: {} },
      reason: `Cloud forbidden for sensitivity ${classification.level}.`,
    };
  }

  if (classification.requiresRedaction) {
    const { redacted, map } = applyRedaction(input);
    return {
      allowCloud: true,
      classification,
      redacted,
      map,
      reason: `Sensitivity ${classification.level} permitted with redaction.`,
    };
  }

  return {
    allowCloud: true,
    classification,
    redacted: input,
    map: { forward: {}, reverse: {} },
    reason: `Sensitivity ${classification.level} permitted as-is.`,
  };
}

/** Sanity check on model output before showing it to the user. */
export function validateModelOutput(
  output: string,
  sensitivity: SensitivityLevel,
): { ok: boolean; reason?: string } {
  // Strip-back hard checks. Cheap. Fast. Conservative.
  const leakedSecret = /\b(?:sk-[a-z0-9]{20,}|-----BEGIN [A-Z ]+PRIVATE KEY-----)\b/i.test(output);
  if (leakedSecret) return { ok: false, reason: "Model output appears to leak a secret." };

  if (sensitivity === "SECURITY_SECRET" || sensitivity === "NEVER_SEND_TO_CLOUD") {
    return { ok: false, reason: "Output rejected: source classified as never-cloud." };
  }
  return { ok: true };
}
