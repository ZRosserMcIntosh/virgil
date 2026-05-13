/**
 * VIRGIL — Lockdown singleton.
 * When engaged, every API path returns "Access denied." regardless of
 * identity, until cleared by OWNER on a trusted device with HARD_APPROVAL.
 */

import { prisma } from "@/lib/db/client";

export interface LockdownView {
  engaged: boolean;
  reason: string | null;
  engagedAt: Date | null;
}

export async function getLockdown(): Promise<LockdownView> {
  const row = await prisma.lockdownState.upsert({
    where: { id: "LOCKDOWN" },
    update: {},
    create: { id: "LOCKDOWN" },
  });
  return { engaged: row.engaged, reason: row.reason, engagedAt: row.engagedAt };
}

export async function engageLockdown(opts: { reason: string; userId?: string }) {
  await prisma.lockdownState.update({
    where: { id: "LOCKDOWN" },
    data: {
      engaged: true,
      reason: opts.reason,
      engagedAt: new Date(),
      engagedByUserId: opts.userId ?? null,
      clearedAt: null,
    },
  });
}

export async function clearLockdown(opts: { userId: string }) {
  await prisma.lockdownState.update({
    where: { id: "LOCKDOWN" },
    data: {
      engaged: false,
      reason: null,
      engagedByUserId: opts.userId,
      clearedAt: new Date(),
    },
  });
}
