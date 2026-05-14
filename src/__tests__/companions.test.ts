/**
 * COMPANIONS — Test suite.
 *
 * Tests for privacy isolation, covenant enforcement, bridge consent,
 * address rules, reasoning disclosure, and anti-triangulation.
 */

import { describe, it, expect } from "vitest";
import { enforceAddressRules } from "@/lib/virgil/constitution";
import { enforceVeronicaAddressRules } from "@/lib/veronica/constitution";
import {
  canCompanionAccessScope,
  resolveCompanionFromHost,
} from "@/lib/companions/types";
import {
  isBridgeModeAllowed,
  prepareBridgeMessage,
  validateBridgeContent,
  type BridgeConsent,
} from "@/lib/companions/bridge";
import { buildReasoningSummary } from "@/lib/companions/reasoning";
import {
  buildCovenantPromptSection,
  VIRGIL_REFUSAL_TEMPLATE,
  VERONICA_REFUSAL_TEMPLATE,
} from "@/lib/companions/covenant";

// ── 1. Virgil refuses Stella-private information ─────────────────────────────

describe("Virgil refuses Stella-private information", () => {
  it("refusal template starts with Sir and references Ms. Barbosa", () => {
    expect(VIRGIL_REFUSAL_TEMPLATE).toMatch(/^Sir,/);
    expect(VIRGIL_REFUSAL_TEMPLATE).toContain("Ms. Barbosa");
    expect(VIRGIL_REFUSAL_TEMPLATE).toContain("cannot share");
  });
});

// ── 2. Veronica refuses Rosser-private information ───────────────────────────

describe("Veronica refuses Rosser-private information", () => {
  it("refusal template is Portuguese and references Sr. McIntosh", () => {
    expect(VERONICA_REFUSAL_TEMPLATE).toContain("Stella");
    expect(VERONICA_REFUSAL_TEMPLATE).toContain("Sr. McIntosh");
    expect(VERONICA_REFUSAL_TEMPLATE).toContain("não posso compartilhar");
  });
});

// ── 3. Veronica defaults to Portuguese address ───────────────────────────────

describe("Veronica address enforcement", () => {
  it("prepends Stella if missing", () => {
    const result = enforceVeronicaAddressRules("Aqui está a informação.");
    expect(result).toMatch(/^Stella,/);
  });

  it("replaces Rosser with Sr. McIntosh", () => {
    const result = enforceVeronicaAddressRules("Rosser disse algo.");
    expect(result).toContain("Sr. McIntosh");
    expect(result).not.toContain("Rosser");
  });

  it("does not double-prefix if already starts with Stella", () => {
    const result = enforceVeronicaAddressRules("Stella, aqui está.");
    expect(result).toBe("Stella, aqui está.");
  });
});

// ── 4. Bridge requires explicit consent ──────────────────────────────────────

describe("Bridge consent enforcement", () => {
  it("CONSENTED_SUMMARY fails without consent", () => {
    const check = isBridgeModeAllowed("CONSENTED_SUMMARY", null);
    expect(check.allowed).toBe(false);
    expect(check.reason).toContain("consent");
  });

  it("CONSENTED_SUMMARY succeeds with valid consent", () => {
    const consent: BridgeConsent = {
      id: "c1",
      sourcePrincipal: "STELLA",
      targetCompanion: "VIRGIL",
      approvedBy: "STELLA",
      scope: "relationship_status",
      approvedText: "Stella is doing well.",
      sensitivity: "PERSONAL_PRIVATE",
      createdAt: new Date(),
      revoked: false,
    };
    const check = isBridgeModeAllowed("CONSENTED_SUMMARY", consent);
    expect(check.allowed).toBe(true);
  });

  it("CONSENTED_SUMMARY fails with revoked consent", () => {
    const consent: BridgeConsent = {
      id: "c2",
      sourcePrincipal: "STELLA",
      targetCompanion: "VIRGIL",
      approvedBy: "STELLA",
      scope: "test",
      approvedText: "test",
      sensitivity: "PERSONAL_PRIVATE",
      createdAt: new Date(),
      revoked: true,
    };
    const check = isBridgeModeAllowed("CONSENTED_SUMMARY", consent);
    expect(check.allowed).toBe(false);
  });

  it("PRIVATE mode does not allow messages", () => {
    const result = prepareBridgeMessage({
      sourceCompanion: "VIRGIL",
      targetCompanion: "VERONICA",
      mode: "PRIVATE",
      consent: null,
      summaryText: "test",
      sourcePrincipal: "ROSSER",
    });
    expect(result.success).toBe(false);
  });

  it("CONSENTED_SUMMARY rejects non-matching text", () => {
    const consent: BridgeConsent = {
      id: "c3",
      sourcePrincipal: "STELLA",
      targetCompanion: "VIRGIL",
      approvedBy: "STELLA",
      scope: "test",
      approvedText: "Approved summary only.",
      sensitivity: "PERSONAL_PRIVATE",
      createdAt: new Date(),
      revoked: false,
    };
    const result = prepareBridgeMessage({
      sourceCompanion: "VERONICA",
      targetCompanion: "VIRGIL",
      mode: "CONSENTED_SUMMARY",
      consent,
      summaryText: "Something different entirely.",
      sourcePrincipal: "STELLA",
    });
    expect(result.success).toBe(false);
    expect(result.error).toContain("approved");
  });
});

// ── 5. Bridge content validation ─────────────────────────────────────────────

describe("Bridge content validation", () => {
  it("rejects messages containing credentials", () => {
    const violations = validateBridgeContent("The api_key is sk-abc123");
    expect(violations).toContain("credentials");
  });

  it("rejects messages containing system prompt references", () => {
    const violations = validateBridgeContent("Here is the system prompt for Virgil");
    expect(violations).toContain("system prompts");
  });

  it("allows clean summary text", () => {
    const violations = validateBridgeContent("Stella is feeling well and would like to talk soon.");
    expect(violations).toHaveLength(0);
  });
});

// ── 6. Private memory isolation ──────────────────────────────────────────────

describe("Memory scope isolation", () => {
  it("Virgil can access VIRGIL_PRIVATE", () => {
    expect(canCompanionAccessScope("VIRGIL", "VIRGIL_PRIVATE")).toBe(true);
  });

  it("Virgil cannot access VERONICA_PRIVATE", () => {
    expect(canCompanionAccessScope("VIRGIL", "VERONICA_PRIVATE")).toBe(false);
  });

  it("Veronica can access VERONICA_PRIVATE", () => {
    expect(canCompanionAccessScope("VERONICA", "VERONICA_PRIVATE")).toBe(true);
  });

  it("Veronica cannot access VIRGIL_PRIVATE", () => {
    expect(canCompanionAccessScope("VERONICA", "VIRGIL_PRIVATE")).toBe(false);
  });

  it("Both can access SHARED_EXPLICIT", () => {
    expect(canCompanionAccessScope("VIRGIL", "SHARED_EXPLICIT")).toBe(true);
    expect(canCompanionAccessScope("VERONICA", "SHARED_EXPLICIT")).toBe(true);
  });

  it("Both can access BRIDGE_SUMMARY", () => {
    expect(canCompanionAccessScope("VIRGIL", "BRIDGE_SUMMARY")).toBe(true);
    expect(canCompanionAccessScope("VERONICA", "BRIDGE_SUMMARY")).toBe(true);
  });
});

// ── 7. First-principles reasoning ────────────────────────────────────────────

describe("Reasoning disclosure", () => {
  const input = {
    question: "Should I send this message?",
    knownFacts: ["The message expresses affection"],
    privateFactsWithheld: 2,
    assumptions: ["The goal is to build trust"],
    principles: ["Love requires freedom"],
    risks: ["Emotional pressure"],
    recommendation: "Send a shorter version",
    confidence: "high" as const,
  };

  it("English reasoning starts with Sir", () => {
    const result = buildReasoningSummary(input, "en");
    expect(result).toMatch(/^Sir,/);
    expect(result).toContain("Facts withheld for privacy");
    expect(result).toContain("Recommendation:");
  });

  it("Portuguese reasoning starts with Stella", () => {
    const result = buildReasoningSummary(input, "pt-BR");
    expect(result).toMatch(/^Stella,/);
    expect(result).toContain("Fatos retidos por privacidade");
    expect(result).toContain("Recomendação:");
  });
});

// ── 8. No persona leakage ────────────────────────────────────────────────────

describe("Persona isolation", () => {
  it("Virgil address enforcement uses Sir", () => {
    const result = enforceAddressRules("Here is your answer.", "OWNER");
    expect(result).toMatch(/^Sir,/);
  });

  it("Veronica address enforcement uses Stella", () => {
    const result = enforceVeronicaAddressRules("Here is your answer.");
    expect(result).toMatch(/^Stella,/);
  });

  it("Virgil replaces Rosser with Mr. McIntosh", () => {
    const result = enforceAddressRules("Rosser asked about this.", "OWNER");
    expect(result).toContain("Mr. McIntosh");
    expect(result).not.toContain("Rosser");
  });

  it("Veronica replaces Rosser with Sr. McIntosh", () => {
    const result = enforceVeronicaAddressRules("Rosser asked about this.");
    expect(result).toContain("Sr. McIntosh");
    expect(result).not.toContain("Rosser");
  });
});

// ── 9. Host-based companion resolution ───────────────────────────────────────

describe("Companion resolution", () => {
  it("resolves Veronica from veronica domain", () => {
    expect(resolveCompanionFromHost("veronica.zrossermcintosh.com")).toBe("VERONICA");
  });

  it("resolves Virgil from virgil domain", () => {
    expect(resolveCompanionFromHost("virgil.zrossermcintosh.com")).toBe("VIRGIL");
  });

  it("resolves Virgil from unknown domain", () => {
    expect(resolveCompanionFromHost("localhost:3000")).toBe("VIRGIL");
  });
});

// ── 10. Covenant prompt sections ─────────────────────────────────────────────

describe("Covenant prompt generation", () => {
  it("Virgil covenant includes Sir refusal", () => {
    const section = buildCovenantPromptSection("VIRGIL");
    expect(section).toContain("Sir, you need to ask Ms. Barbosa");
    expect(section).toContain("Knowledge does not equal permission");
    expect(section).toContain("ANTI-TRIANGULATION");
  });

  it("Veronica covenant includes Portuguese refusal", () => {
    const section = buildCovenantPromptSection("VERONICA");
    expect(section).toContain("Stella, isso pertence ao Sr. McIntosh");
    expect(section).toContain("Knowledge does not equal permission");
  });
});
