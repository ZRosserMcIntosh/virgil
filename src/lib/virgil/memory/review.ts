/**
 * VIRGIL Memory — correction and soft-delete (forget).
 *
 * Rules:
 *   - Correction: mark old SUPERSEDED → create new → link via MemoryEdge.
 *   - Forget (soft): status = DELETED, content cleared, tombstone kept.
 *   - Forget (hard): owner only, STRONG_VERIFIED required, rows deleted.
 *   - Both operations are owner-only.
 */

import { prisma } from "@/lib/db/client";
import type { TrustContext } from "@/lib/virgil/types";
import { PermissionLevel } from "@/lib/virgil/types";
import { logMemoryAccess } from "./access-log";
import type { MemoryRecordInput } from "@/lib/virgil/types";
import type { SensitivityLevel } from "@prisma/client";

export interface CorrectionInput {
  memoryId: string;
  newTitle: string;
  newContent: string;
  reason: string;
  trust: TrustContext;
}

export interface ForgetInput {
  memoryId: string;
  trust: TrustContext;
  hard?: boolean;
}

export type CorrectionResult =
  | { status: "ok";      newMemoryId: string }
  | { status: "denied";  reason: string };

export type ForgetResult =
  | { status: "ok" }
  | { status: "denied";  reason: string };

export async function correctMemory(input: CorrectionInput): Promise<CorrectionResult> {
  const { trust } = input;

  if (!trust.isOwner) {
    return { status: "denied", reason: "owner_only" };
  }

  const old = await prisma.memory.findUnique({ where: { id: input.memoryId } });
  if (!old) return { status: "denied", reason: "not_found" };
  if (old.status === "DELETED") return { status: "denied", reason: "already_deleted" };

  // Mark old as superseded
  await prisma.memory.update({
    where: { id: old.id },
    data:  { status: "SUPERSEDED", supersededById: "pending" },
  });

  // Create replacement
  const replacement = await prisma.memory.create({
    data: {
      ownerId:           old.ownerId,
      title:             input.newTitle,
      content:           input.newContent,
      summary:           input.newContent.slice(0, 200),
      searchText:        [input.newTitle, input.newContent].join(" ").toLowerCase(),
      category:          old.category,
      sensitivity:       old.sensitivity,
      status:            "ACTIVE",
      sourceType:        "USER_DIRECT",
      confidence:        Math.max(old.confidence, 0.9),
      importance:        old.importance,
      source:            "owner_correction",
      cloudAllowed:      old.cloudAllowed,
      neverSendToCloud:  old.neverSendToCloud,
      pepperVisibility:  old.pepperVisibility,
      projectId:         old.projectId,
      personRef:         old.personRef,
      supersedesMemoryId: old.id,
      writePolicy:       "AUTO_SAFE",
    },
  });

  // Back-link the old record
  await prisma.memory.update({
    where: { id: old.id },
    data:  { supersededById: replacement.id },
  });

  // Memory edge
  await prisma.memoryEdge.create({
    data: {
      fromMemoryId: replacement.id,
      toMemoryId:   old.id,
      type:         "SUPERSEDES",
      reason:       input.reason,
    },
  });

  await logMemoryAccess({
    memoryId: old.id, userId: trust.userId, identity: trust.identity,
    role: "ADMIN_REVIEW", action: "correct", allowed: true,
    reason: input.reason, sensitivity: old.sensitivity as SensitivityLevel,
  });

  return { status: "ok", newMemoryId: replacement.id };
}

export async function forgetMemory(input: ForgetInput): Promise<ForgetResult> {
  const { trust } = input;

  if (!trust.isOwner) {
    return { status: "denied", reason: "owner_only" };
  }
  if (input.hard && trust.authorizationLevel < PermissionLevel.STRONG_VERIFIED) {
    return { status: "denied", reason: "hard_delete_requires_strong_verified" };
  }

  const mem = await prisma.memory.findUnique({ where: { id: input.memoryId } });
  if (!mem) return { status: "denied", reason: "not_found" };

  if (input.hard) {
    await prisma.memory.delete({ where: { id: input.memoryId } });
  } else {
    await prisma.memory.update({
      where: { id: input.memoryId },
      data: {
        status:          "DELETED",
        content:         null,
        encryptedContent: null,
        summary:         "[deleted]",
        searchText:      null,
      },
    });
  }

  await logMemoryAccess({
    memoryId: input.memoryId, userId: trust.userId, identity: trust.identity,
    role: "ADMIN_REVIEW", action: input.hard ? "delete" : "forget",
    allowed: true, reason: input.hard ? "hard_delete" : "soft_delete",
    sensitivity: mem.sensitivity as SensitivityLevel,
  });

  return { status: "ok" };
}
