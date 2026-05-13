/**
 * VIRGIL Memory — candidate ranking.
 *
 * Pure function — no I/O. Scores a single memory against a query.
 * Formula weights defined in the build brief.
 */

import type { Memory } from "@prisma/client";

export interface RankInput {
  memory: Memory;
  inputLower: string;
  terms: string[];
  projectId?: string;
  personRef?: string;
  categories?: string[];
}

export function rankMemoryCandidate(r: RankInput): number {
  const m = r.memory;
  const now = Date.now();

  // ── Keyword / semantic match ──────────────────────────────────────────────
  const searchableText = [
    m.title ?? "",
    m.summary ?? "",
    m.searchText ?? "",
    (m.tags ?? []).join(" "),
    m.personRef ?? "",
  ]
    .join(" ")
    .toLowerCase();

  let keywordHits = 0;
  for (const term of r.terms) {
    if (searchableText.includes(term)) keywordHits++;
  }
  const keywordScore = r.terms.length > 0 ? keywordHits / r.terms.length : 0;

  // Exact title match bonus
  const titleMatchBonus = m.title.toLowerCase().includes(r.inputLower.slice(0, 40)) ? 0.2 : 0;

  // Tag exact match bonus
  const tagMatchBonus = (m.tags ?? []).some((t) => r.terms.includes(t.toLowerCase())) ? 0.1 : 0;

  // ── Project match ─────────────────────────────────────────────────────────
  const projectScore = r.projectId && m.projectId === r.projectId ? 1.0 : 0.0;

  // ── Person match ──────────────────────────────────────────────────────────
  const personScore =
    r.personRef && m.personRef && m.personRef.toLowerCase().includes(r.personRef.toLowerCase())
      ? 1.0
      : 0.0;

  // ── Category match ────────────────────────────────────────────────────────
  const categoryScore = r.categories?.includes(m.category) ? 1.0 : 0.0;

  // ── Importance (0–100 → 0–1) ──────────────────────────────────────────────
  const importanceScore = Math.min(m.importance, 100) / 100;

  // ── Confidence (0–1) ──────────────────────────────────────────────────────
  const confidenceScore = Math.min(Math.max(m.confidence, 0), 1);

  // ── Recency ───────────────────────────────────────────────────────────────
  const ageMs = now - m.updatedAt.getTime();
  const ageDays = ageMs / (1000 * 60 * 60 * 24);
  const recencyScore = Math.max(0, 1 - ageDays / 365); // linear decay over 1 year

  // ── Pinned boost ──────────────────────────────────────────────────────────
  const pinnedBoost = m.pinned ? 1.0 : 0.0;

  // ── Access count (log scale) ──────────────────────────────────────────────
  const accessBoost = Math.min(Math.log1p(m.accessCount) / 5, 0.2);

  // ── Stale penalty ─────────────────────────────────────────────────────────
  // Low importance AND old AND rarely accessed
  const stalePenalty =
    m.importance < 30 && ageDays > 180 && m.accessCount < 2 ? 0.25 : 0;

  // ── Superseded / proposed penalty ────────────────────────────────────────
  const statusPenalty =
    m.status === "SUPERSEDED" ? 0.4
    : m.status === "PROPOSED" ? 0.2
    : 0;

  // ── Final score ───────────────────────────────────────────────────────────
  const raw =
    (keywordScore + titleMatchBonus + tagMatchBonus) * 0.35 +
    projectScore  * 0.15 +
    personScore   * 0.12 +
    categoryScore * 0.10 +
    importanceScore * 0.10 +
    confidenceScore * 0.08 +
    recencyScore  * 0.05 +
    pinnedBoost   * 0.05 +
    accessBoost;

  return Math.max(0, raw - stalePenalty - statusPenalty);
}

/** Extract simple keyword terms from raw input. */
export function extractTerms(input: string): string[] {
  return input
    .toLowerCase()
    .replace(/[^\w\s]/g, " ")
    .split(/\s+/)
    .filter((t) => t.length > 2 && !STOP_WORDS.has(t));
}

const STOP_WORDS = new Set([
  "the", "and", "for", "are", "was", "were", "has", "have", "had",
  "that", "this", "with", "what", "will", "can", "could", "should",
  "would", "about", "from", "they", "then", "than", "there", "their",
  "when", "which", "who", "how", "all", "any", "been", "its", "you",
  "not", "but", "she", "him", "her", "our", "out", "one", "said",
  "now", "did",
]);
