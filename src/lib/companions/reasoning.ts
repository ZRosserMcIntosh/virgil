/**
 * COMPANIONS — First-principles reasoning disclosure.
 *
 * When either companion is challenged ("why?"), this produces a concise,
 * safe, structured reasoning summary. It does NOT expose hidden
 * chain-of-thought. It exposes the defensible reasoning frame.
 */

export interface ReasoningInput {
  question: string;
  knownFacts: string[];
  privateFactsWithheld: number;
  assumptions: string[];
  principles: string[];
  risks: string[];
  recommendation: string;
  confidence: "low" | "medium" | "high";
}

/**
 * Build a reasoning summary suitable for disclosure to the principal.
 *
 * @param input - structured reasoning components
 * @param language - "en" for English (Virgil), "pt-BR" for Portuguese (Veronica)
 */
export function buildReasoningSummary(
  input: ReasoningInput,
  language: "en" | "pt-BR" = "en",
): string {
  if (language === "pt-BR") {
    return buildPortugueseReasoning(input);
  }
  return buildEnglishReasoning(input);
}

function buildEnglishReasoning(r: ReasoningInput): string {
  const lines: string[] = [];
  lines.push("Sir, my reasoning is:");
  lines.push(`1. Question: ${r.question}`);
  lines.push(`2. Facts used: ${r.knownFacts.join("; ")}`);
  if (r.privateFactsWithheld > 0) {
    lines.push(`3. Facts withheld for privacy: ${r.privateFactsWithheld} item(s).`);
  }
  lines.push(`${r.privateFactsWithheld > 0 ? "4" : "3"}. Assumptions: ${r.assumptions.join("; ")}`);
  const base = r.privateFactsWithheld > 0 ? 5 : 4;
  lines.push(`${base}. Principles applied: ${r.principles.join("; ")}`);
  lines.push(`${base + 1}. Risks considered: ${r.risks.join("; ")}`);
  lines.push(`${base + 2}. Recommendation: ${r.recommendation}`);
  lines.push(`${base + 3}. Confidence: ${r.confidence}.`);
  return lines.join("\n");
}

function buildPortugueseReasoning(r: ReasoningInput): string {
  const lines: string[] = [];
  lines.push("Stella, meu raciocínio é:");
  lines.push(`1. Pergunta: ${r.question}`);
  lines.push(`2. Fatos usados: ${r.knownFacts.join("; ")}`);
  if (r.privateFactsWithheld > 0) {
    lines.push(`3. Fatos retidos por privacidade: ${r.privateFactsWithheld} item(ns).`);
  }
  lines.push(`${r.privateFactsWithheld > 0 ? "4" : "3"}. Suposições: ${r.assumptions.join("; ")}`);
  const base = r.privateFactsWithheld > 0 ? 5 : 4;
  lines.push(`${base}. Princípios aplicados: ${r.principles.join("; ")}`);
  lines.push(`${base + 1}. Riscos considerados: ${r.risks.join("; ")}`);
  lines.push(`${base + 2}. Recomendação: ${r.recommendation}`);
  lines.push(`${base + 3}. Confiança: ${r.confidence}.`);
  return lines.join("\n");
}
