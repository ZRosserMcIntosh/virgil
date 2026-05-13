/**
 * VIRGIL — Audit log writer.
 * Metadata-only. Never store raw sensitive content here.
 */

import { prisma } from "@/lib/db/client";
import type { Prisma } from "@prisma/client";
import type { IdentityType, SensitivityLevel, TrustContext } from "./types";

export interface AuditWrite {
  trust: TrustContext;
  actionRequested: string;
  actionTaken: string;
  result: "ok" | "denied" | "error" | "staged" | "lockdown";
  resultDetail?: string;
  toolUsed?: string;
  providerUsed?: string;
  modelUsed?: string;
  approvalId?: string;
  approvalRequired?: boolean;
  sentToCloud?: boolean;
  redactionApplied?: boolean;
  sensitivity?: SensitivityLevel;
}

export async function writeAudit(w: AuditWrite): Promise<string> {
  const data: Prisma.AuditEventCreateInput = {
    actionRequested: w.actionRequested,
    actionTaken: w.actionTaken,
    result: w.result,
    resultDetail: w.resultDetail ?? null,
    toolUsed: w.toolUsed ?? null,
    providerUsed: w.providerUsed ?? null,
    modelUsed: w.modelUsed ?? null,
    approvalId: w.approvalId ?? null,
    approvalRequired: w.approvalRequired ?? false,
    sentToCloud: w.sentToCloud ?? false,
    redactionApplied: w.redactionApplied ?? false,
    sensitivity: w.sensitivity ?? null,
    sessionId: w.trust.sessionId ?? null,
    trustLevel: w.trust.authorizationLevel,
    identity: w.trust.identity as IdentityType,
    user: w.trust.userId ? { connect: { id: w.trust.userId } } : undefined,
  };
  const ev = await prisma.auditEvent.create({ data });
  return ev.id;
}
