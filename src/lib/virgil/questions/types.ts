/**
 * VIRGIL — Personal Question Mode types & helpers.
 */

export const QUESTION_DOMAIN_LABELS: Record<string, string> = {
  COMMAND_STYLE:       "Command Style",
  FAITH:               "Faith & Conscience",
  FATHERHOOD:          "Fatherhood",
  BUSINESS:            "Business & Strategy",
  RELATIONSHIPS:       "Relationships & Trust",
  EMOTIONAL_PATTERNS:  "Emotional Patterns",
  HEALTH:              "Health & Discipline",
  RISK:                "Risk & Decision-Making",
  MONEY:               "Money & Finance",
  LEGAL:               "Legal Context",
  LEGACY:              "Legacy",
  COMMUNICATION_STYLE: "Communication Style",
  BOUNDARIES:          "Boundaries",
  CURRENT_MISSIONS:    "Current Missions",
};

export const DEPTH_RULES = {
  LIGHT:    { maxQuestions: 1, allowedWeights: ["LIGHT"] },
  STANDARD: { maxQuestions: 3, allowedWeights: ["LIGHT", "MODERATE"] },
  DEEP:     { maxQuestions: 5, allowedWeights: ["LIGHT", "MODERATE", "HEAVY"] },
} as const;

export function calcUnderstandingScore(
  confirmedMemories: number,
  answeredQuestions: number,
): number {
  return Math.min(100, confirmedMemories * 8 + answeredQuestions * 5);
}

export const SACRED_CATEGORIES = new Set([
  "children", "faith", "trauma", "legal", "romantic_intimacy",
  "serious_health", "deep_family_pain", "confession", "matters_of_conscience",
]);

export function isSacred(sensitivity: string): boolean {
  return sensitivity === "SACRED";
}
