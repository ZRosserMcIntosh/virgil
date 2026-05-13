/**
 * VIRGIL — Adversary scoring + denial list.
 *
 * Each suspicious event bumps a per-subject score (keyed by IP hash, device
 * fingerprint hash, or UA hash). Crossing thresholds auto-promotes to a
 * DenialEntry. Outside response is always "Access denied." regardless.
 */

import { prisma } from "@/lib/db/client";
import { hashOpaque } from "@/lib/encryption";
import type { Prisma } from "@prisma/client";

export type SubjectKind = "ip" | "fp" | "ua";

const PROMOTE_AT = 75;        // score → automatic denial entry
const PROMOTE_HITS = 5;       // raw hit count → automatic denial entry
const DEFAULT_BUMP = 20;

function key(kind: SubjectKind, raw: string): string {
  return `${kind}:${hashOpaque(raw, kind)}`;
}

export async function isDenied(opts: { ip?: string; ua?: string; fp?: string; email?: string }): Promise<boolean> {
  const matchers: Prisma.DenialEntryWhereInput[] = [];
  if (opts.ip)    matchers.push({ kind: "IP_HASH",            valueHash: hashOpaque(opts.ip, "ip") });
  if (opts.ua)    matchers.push({ kind: "USER_AGENT_HASH",    valueHash: hashOpaque(opts.ua, "ua") });
  if (opts.fp)    matchers.push({ kind: "DEVICE_FINGERPRINT", valueHash: hashOpaque(opts.fp, "device") });
  if (opts.email) matchers.push({ kind: "EMAIL",              valueHash: hashOpaque(opts.email.toLowerCase(), "email") });
  if (matchers.length === 0) return false;

  const now = new Date();
  const found = await prisma.denialEntry.findFirst({
    where: {
      AND: [
        { OR: matchers },
        { OR: [{ expiresAt: null }, { expiresAt: { gt: now } }] },
      ],
    },
  });
  return !!found;
}

export async function bumpAdversaryScore(
  kind: SubjectKind,
  raw: string,
  delta: number = DEFAULT_BUMP,
): Promise<{ score: number; hits: number; promoted: boolean }> {
  const k = key(kind, raw);
  const row = await prisma.adversaryScore.upsert({
    where: { subjectKey: k },
    update: { score: { increment: delta }, hits: { increment: 1 }, lastHitAt: new Date() },
    create: { subjectKey: k, score: delta, hits: 1 },
  });

  let promoted = false;
  if (row.score >= PROMOTE_AT || row.hits >= PROMOTE_HITS) {
    const denialKind =
      kind === "ip" ? "IP_HASH" :
      kind === "fp" ? "DEVICE_FINGERPRINT" :
                       "USER_AGENT_HASH";
    const valueHash = hashOpaque(raw, kind);
    try {
      await prisma.denialEntry.create({
        data: {
          kind: denialKind,
          valueHash,
          reason: `auto-promoted at score=${row.score} hits=${row.hits}`,
          severity: "HIGH",
        },
      });
      promoted = true;
    } catch {
      // already on the list
    }
  }
  return { score: row.score, hits: row.hits, promoted };
}
