/**
 * VIRGIL Memory — write engine.
 *
 * Owner commands: "remember that…", "save this…", "never forget…",
 * "forget that…", "that's wrong…", "correct this…", "update your memory…".
 *
 * Write policy:
 *   AUTO_SAFE     → write immediately (public/internal, direct, confident)
 *   REVIEW        → queue to MemoryReviewQueue for owner confirmation
 *   REJECT        → refuse (stranger/adversary, secrets, injection-shaped)
 */

import { prisma } from "@/lib/db/client";
import type { MemorySourceType, MemoryCategory, SensitivityLevel } from "@prisma/client";
import type { TrustContext, MemoryRecordInput } from "@/lib/virgil/types";
import { logMemoryAccess } from "./access-log";

const AUTO_SAFE_SENSITIVITIES: SensitivityLevel[] = ["PUBLIC", "BUSINESS_INTERNAL"];
const REVIEW_CATEGORIES: MemoryCategory[] = ["PERSON", "PERSONAL", "SECURITY", "PEPPER", "DECISION_JOURNAL"];

export interface MemoryWriteInput extends MemoryRecordInput {
  trust: TrustContext;
  sourceType: MemorySourceType;
  sourceId?: string;
  reason: string;
}

export type WriteResult =
  | { status: "written";  memoryId: string;  reason: string }
  | { status: "queued";   reviewId: string;  reason: string }
  | { status: "rejected"; reason: string };

export async function proposeMemoryWrite(input: MemoryWriteInput): Promise<WriteResult> {
  const { trust } = input;

  // --- Hard rejections ---
  if (trust.lockedDown) {
    return { status: "rejected", reason: "lockdown" };
  }
  if (trust.denied || trust.identity === "ADVERSARY" || trust.identity === "STRANGER") {
    await logMemoryAccess({
      userId: trust.userId, identity: trust.identity,
      role: "USER_CONTEXT", action: "reject", allowed: false, reason: "identity_blocked",
    });
    return { status: "rejected", reason: "identity_blocked" };
  }
  if (!trust.isOwner) {
    // Non-owner writes always go to review queue; Delegate/Pepper cannot auto-write.
    return enqueue(input, "non_owner_write");
  }

  const sensitivity = input.sensitivity as SensitivityLevel;
  const category    = input.category as MemoryCategory;

  // --- Determine write policy ---
  const isAutoSafe =
    AUTO_SAFE_SENSITIVITIES.includes(sensitivity) &&
    !REVIEW_CATEGORIES.includes(category) &&
    (input.confidence ?? 0) >= 0.85 &&
    (input.importance ?? 0) >= 60 &&
    (input.sourceType === "USER_DIRECT" || input.sourceType === "SYSTEM");

  if (!isAutoSafe) {
    return enqueue(input, "requires_owner_review");
  }

  // --- Auto write ---
  const mem = await prisma.memory.create({
    data: {
      ownerId:         trust.userId!,
      title:           input.title,
      content:         input.content,
      summary:         input.content?.slice(0, 200),
      searchText:      buildSearchText(input),
      category:        category,
      sensitivity:     sensitivity,
      status:          "ACTIVE",
      sourceType:      input.sourceType,
      sourceId:        input.sourceId ?? null,
      confidence:      input.confidence ?? 0.9,
      importance:      input.importance ?? 70,
      source:          input.source ?? "owner_command",
      cloudAllowed:    input.cloudAllowed ?? false,
      neverSendToCloud: input.neverSendToCloud ?? false,
      pepperVisibility: input.pepperVisibility ?? null,
      projectId:       input.projectId ?? null,
      personRef:       input.personRef ?? null,
      writePolicy:     "AUTO_SAFE",
    },
  });

  await logMemoryAccess({
    memoryId: mem.id, userId: trust.userId, identity: trust.identity,
    role: "USER_CONTEXT", action: "write", allowed: true, reason: "auto_safe",
    sensitivity, projectId: input.projectId,
  });

  return { status: "written", memoryId: mem.id, reason: "auto_safe" };
}

async function enqueue(input: MemoryWriteInput, reason: string): Promise<WriteResult> {
  const sensitivity = input.sensitivity as SensitivityLevel;
  const category    = input.category as MemoryCategory;

  const review = await prisma.memoryReviewQueue.create({
    data: {
      proposedTitle:   input.title,
      proposedContent: input.content ?? "",
      proposedSummary: input.content?.slice(0, 200),
      category,
      sensitivity,
      sourceType:      input.sourceType,
      sourceId:        input.sourceId ?? null,
      projectId:       input.projectId ?? null,
      personRef:       input.personRef ?? null,
      confidence:      input.confidence ?? 0.7,
      importance:      input.importance ?? 50,
      reason,
      createdByUserId: input.trust.userId ?? null,
    },
  });

  await logMemoryAccess({
    userId: input.trust.userId, identity: input.trust.identity,
    role: "USER_CONTEXT", action: "write", allowed: true, reason: "queued",
    sensitivity, projectId: input.projectId,
  });

  return { status: "queued", reviewId: review.id, reason };
}

function buildSearchText(input: MemoryRecordInput): string {
  return [input.title, input.content?.slice(0, 400)].filter(Boolean).join(" ").toLowerCase();
}

// ── Command detection (regex, no LLM) ────────────────────────────────────────

const REMEMBER_RE    = /^(?:remember(?: that)?|save this|never forget)[:\s]+(.+)/i;
const FORGET_RE      = /^(?:forget(?: that)?|don't remember)[:\s]+(.+)/i;
const CORRECT_RE     = /^(?:that(?:'s| is) wrong|correct this|update your memory)[:\s]+(.+)/i;
const WORKING_RE     = /^(?:always|work style|working style|preference)[:\s]+(.+)/i;

export interface MemoryCommand {
  type: "remember" | "forget" | "correct" | "preference";
  content: string;
}

export function detectMemoryCommand(input: string): MemoryCommand | null {
  const trimmed = input.trim();
  const rm = trimmed.match(REMEMBER_RE);
  if (rm?.[1]) return { type: "remember", content: rm[1] };
  const fm = trimmed.match(FORGET_RE);
  if (fm?.[1]) return { type: "forget",   content: fm[1] };
  const cm = trimmed.match(CORRECT_RE);
  if (cm?.[1]) return { type: "correct",  content: cm[1] };
  const wm = trimmed.match(WORKING_RE);
  if (wm?.[1]) return { type: "preference", content: wm[1] };
  return null;
}
