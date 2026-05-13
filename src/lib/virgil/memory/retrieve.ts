/**
 * VIRGIL Memory — retrieval engine (Phase 1: keyword + Postgres, no vectors).
 *
 * Pipeline:
 *   1. Guard  — identity / lockdown / auth check
 *   2. Query  — derive terms, project, person, categories
 *   3. Select — Postgres candidates (max 40)
 *   4. Rank   — score + sort
 *   5. Budget — token-limit + sensitivity filter
 *   6. Format — build context block
 *   7. Log    — access log + update counters
 */

import { prisma } from "@/lib/db/client";
import type { MemoryQuery, MemoryContextBlock, RetrievedMemory } from "./types";
import { isNeverCloud } from "./types";
import { canIdentitySeeMemory } from "./visibility";
import { rankMemoryCandidate, extractTerms } from "./rank";
import { formatMemoryContextBlock } from "./format-context";
import { logMemoryAccess, logMemoryRetrievalBatch } from "./access-log";

const MAX_CANDIDATES = 40;

export async function retrieveRelevantMemories(
  query: MemoryQuery,
): Promise<MemoryContextBlock> {
  const empty: MemoryContextBlock = {
    text: "",
    memoryIds: [],
    sensitivityCeiling: "PUBLIC",
    requiresLocalRoute: false,
  };

  // ── Stage 1: Guard ────────────────────────────────────────────────────────
  if (
    query.identity === "STRANGER" ||
    query.identity === "ADVERSARY" ||
    !query.userId
  ) {
    await logMemoryAccess({
      userId:  query.userId,
      identity: query.identity,
      role:    query.role,
      action:  "reject",
      allowed: false,
      reason:  "identity_blocked",
      rawQuery: query.input,
    });
    return empty;
  }

  // ── Stage 2: Query expansion (deterministic, no LLM) ─────────────────────
  const terms = extractTerms(query.input);
  const inputLower = query.input.toLowerCase();

  // Infer project from slug match in input
  let resolvedProjectId = query.projectId;
  if (!resolvedProjectId && query.projectSlug) {
    const proj = await prisma.project.findUnique({
      where: { slug: query.projectSlug },
      select: { id: true },
    });
    resolvedProjectId = proj?.id;
  }

  // ── Stage 3: Candidate selection ─────────────────────────────────────────
  const whereBase = {
    ownerId: query.userId,
    status:  "ACTIVE" as const,
    OR: [
      { expiresAt: null },
      { expiresAt: { gt: new Date() } },
    ],
  };

  // Build a broad OR filter on text fields
  const textFilters = terms.length > 0
    ? terms.flatMap((t) => [
        { title:      { contains: t, mode: "insensitive" as const } },
        { summary:    { contains: t, mode: "insensitive" as const } },
        { searchText: { contains: t, mode: "insensitive" as const } },
        { tags:       { has: t } },
        { personRef:  { contains: t, mode: "insensitive" as const } },
      ])
    : [];

  const projectFilter = resolvedProjectId ? { projectId: resolvedProjectId } : {};
  const categoryFilter = query.categories?.length
    ? { category: { in: query.categories } }
    : {};

  const candidates = await prisma.memory.findMany({
    where: {
      ...whereBase,
      ...projectFilter,
      ...categoryFilter,
      ...(textFilters.length > 0 ? { OR: textFilters } : {}),
    },
    orderBy: [{ importance: "desc" }, { updatedAt: "desc" }],
    take: MAX_CANDIDATES,
  });

  // ── Stage 4: Visibility filter + ranking ─────────────────────────────────
  // We need a minimal TrustContext shape for visibility checks.
  const trustLike = {
    identity: query.identity,
    isOwner: query.isOwner,
    isPepper: query.isPepper,
    pepperRung: query.pepperRung,
    isAuthenticated: true,
    lockedDown: false,
    denied: false,
  } as Parameters<typeof canIdentitySeeMemory>[1];

  const scored: Array<{ memory: (typeof candidates)[0]; score: number }> = [];

  for (const mem of candidates) {
    const vis = canIdentitySeeMemory(mem, trustLike);
    if (!vis.allowed) continue;

    // Owner requested sacred inclusion toggle
    if (!query.includeSacred && isNeverCloud(mem.sensitivity)) {
      if (!query.isOwner) continue; // non-owner never gets sacred
      // Owner still gets it, but we'll mark requiresLocalRoute in formatter
    }

    const score = rankMemoryCandidate({
      memory: mem,
      inputLower,
      terms,
      projectId: resolvedProjectId,
      personRef: undefined,
      categories: query.categories as string[] | undefined,
    });

    scored.push({ memory: mem, score });
  }

  scored.sort((a, b) => b.score - a.score);

  const top = scored.slice(0, query.maxResults ?? 8);

  // ── Stage 5 + 6: Budget + format ─────────────────────────────────────────
  const retrieved: RetrievedMemory[] = top.map(({ memory: m, score }) => ({
    id:          m.id,
    title:       m.title,
    content:     m.content ?? "",
    summary:     m.summary,
    category:    m.category,
    sensitivity: m.sensitivity,
    importance:  m.importance,
    confidence:  m.confidence,
    projectId:   m.projectId,
    personRef:   m.personRef,
    source:      m.source,
    sourceType:  m.sourceType,
    createdAt:   m.createdAt,
    updatedAt:   m.updatedAt,
    score,
    reason:      `score=${score.toFixed(3)}`,
  }));

  const block = formatMemoryContextBlock(retrieved, {
    identity:   query.identity,
    allowCloud: !retrieved.some((r) => isNeverCloud(r.sensitivity)),
  });

  // ── Stage 7: Access logging + counter updates ─────────────────────────────
  if (block.memoryIds.length > 0) {
    await logMemoryRetrievalBatch(block.memoryIds, {
      userId:   query.userId,
      identity: query.identity,
      role:     query.role,
      action:   "retrieve",
      allowed:  true,
      sensitivity: block.sensitivityCeiling,
      projectId:   resolvedProjectId,
      rawQuery:    query.input,
    });

    // Bump access counts + lastAccessedAt (fire-and-forget, non-blocking)
    prisma.memory.updateMany({
      where: { id: { in: block.memoryIds } },
      data: {
        accessCount:   { increment: 1 },
        lastAccessedAt: new Date(),
      },
    }).catch(() => null);
  }

  return block;
}
