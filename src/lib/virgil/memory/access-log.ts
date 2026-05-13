/**
 * VIRGIL Memory — access log writer.
 *
 * Every memory retrieval, denial, write, forget, or correction is persisted
 * here. Do not store raw query text — store hash only.
 */

import { createHash } from "crypto";
import { prisma } from "@/lib/db/client";
import type { IdentityType, MemoryRetrievalRole, SensitivityLevel } from "@prisma/client";

export interface AccessLogEntry {
  memoryId?: string;
  userId: string | null;
  identity: IdentityType;
  role: MemoryRetrievalRole;
  action: "read" | "write" | "update" | "suppress" | "delete" | "retrieve" | "reject" | "forget" | "correct";
  allowed: boolean;
  reason?: string;
  sensitivity?: SensitivityLevel;
  projectId?: string;
  rawQuery?: string;         // hashed before storage
}

export async function logMemoryAccess(entry: AccessLogEntry): Promise<void> {
  const queryHash = entry.rawQuery
    ? createHash("sha256").update(entry.rawQuery).digest("hex").slice(0, 16)
    : undefined;

  await prisma.memoryAccessLog.create({
    data: {
      memoryId:   entry.memoryId ?? null,
      userId:     entry.userId ?? null,
      identity:   entry.identity,
      role:       entry.role,
      action:     entry.action,
      allowed:    entry.allowed,
      reason:     entry.reason ?? null,
      sensitivity: entry.sensitivity ?? null,
      projectId:  entry.projectId ?? null,
      queryHash:  queryHash ?? null,
    },
  });
}

/** Bulk log for a batch of retrieved memory IDs. */
export async function logMemoryRetrievalBatch(
  memoryIds: string[],
  entry: Omit<AccessLogEntry, "memoryId">,
): Promise<void> {
  if (memoryIds.length === 0) return;
  const queryHash = entry.rawQuery
    ? createHash("sha256").update(entry.rawQuery).digest("hex").slice(0, 16)
    : undefined;

  await prisma.memoryAccessLog.createMany({
    data: memoryIds.map((id) => ({
      memoryId:   id,
      userId:     entry.userId ?? null,
      identity:   entry.identity,
      role:       entry.role,
      action:     entry.action,
      allowed:    entry.allowed,
      reason:     entry.reason ?? null,
      sensitivity: entry.sensitivity ?? null,
      projectId:  entry.projectId ?? null,
      queryHash:  queryHash ?? null,
    })),
    skipDuplicates: true,
  });
}
