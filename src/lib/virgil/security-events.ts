/**
 * VIRGIL — Security event writer + Black Door Protocol.
 *
 * BLACK_DOOR is the cold-shutdown posture. When triggered:
 *   - Tools are disabled for the session.
 *   - The external response is exactly "Access denied."
 *   - Internally Rosser sees a record: what happened, no data disclosed.
 */

import { prisma } from "@/lib/db/client";
import type { Prisma, SecurityEventType, Severity } from "@prisma/client";
import type { TrustContext } from "./types";

export interface SecurityEventWrite {
  type: SecurityEventType;
  severity?: Severity;
  summary: string;
  trust?: TrustContext;
  metadata?: Prisma.InputJsonValue;
}

export async function recordSecurityEvent(w: SecurityEventWrite): Promise<string> {
  const ev = await prisma.securityEvent.create({
    data: {
      type: w.type,
      severity: w.severity ?? "MEDIUM",
      summary: w.summary,
      metadata: w.metadata,
      ipHash: w.trust?.ipHash ?? null,
      userAgent: w.trust?.userAgent ?? null,
      user: w.trust?.userId ? { connect: { id: w.trust.userId } } : undefined,
    },
  });
  return ev.id;
}

export interface BlackDoorTrigger {
  reason: string;
  trust?: TrustContext;
  metadata?: Prisma.InputJsonValue;
}

export interface BlackDoorResult {
  triggered: true;
  externalMessage: "Access denied.";
  internalSummary: string;
  securityEventId: string;
}

export async function triggerBlackDoor(t: BlackDoorTrigger): Promise<BlackDoorResult> {
  const summary = `Black Door Protocol triggered. Reason: ${t.reason}. No data disclosed.`;
  const id = await recordSecurityEvent({
    type: "BLACK_DOOR_TRIGGERED",
    severity: "HIGH",
    summary,
    trust: t.trust,
    metadata: t.metadata,
  });
  return {
    triggered: true,
    externalMessage: "Access denied.",
    internalSummary: summary,
    securityEventId: id,
  };
}
