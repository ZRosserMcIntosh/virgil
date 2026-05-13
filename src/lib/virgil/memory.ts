/**
 * VIRGIL — Memory helpers.
 * Encryption is applied automatically when sensitivity warrants it.
 */

import { prisma } from "@/lib/db/client";
import { encryptString, decryptString } from "@/lib/encryption";
import type { MemoryRecordInput } from "./types";
import type { MemoryCategory, SensitivityLevel } from "@prisma/client";

const ENCRYPT_AT_OR_ABOVE: SensitivityLevel[] = [
  "BUSINESS_CONFIDENTIAL",
  "PERSONAL_PRIVATE",
  "PERSONAL_SACRED",
  "SECURITY_SECRET",
  "NEVER_SEND_TO_CLOUD",
];

export async function createMemory(ownerId: string, input: MemoryRecordInput) {
  const sens = input.sensitivity as SensitivityLevel;
  const shouldEncrypt = ENCRYPT_AT_OR_ABOVE.includes(sens);
  const cloudAllowed =
    input.cloudAllowed ?? (sens === "PUBLIC" || sens === "BUSINESS_INTERNAL");
  const neverSendToCloud =
    input.neverSendToCloud ?? (sens === "NEVER_SEND_TO_CLOUD" || sens === "SECURITY_SECRET");

  return prisma.memory.create({
    data: {
      ownerId,
      title: input.title,
      content: shouldEncrypt ? null : input.content,
      encryptedContent: shouldEncrypt ? encryptString(input.content) : null,
      encrypted: shouldEncrypt,
      category: input.category as MemoryCategory,
      sensitivity: sens,
      confidence: input.confidence ?? 0.8,
      importance: input.importance ?? 50,
      source: input.source ?? "manual",
      projectId: input.projectId ?? null,
      personRef: input.personRef ?? null,
      cloudAllowed,
      neverSendToCloud,
    },
  });
}

/** Returns plaintext only if caller is authorized. The DB row is the source of truth. */
export async function readMemoryPlain(memoryId: string): Promise<string | null> {
  const m = await prisma.memory.findUnique({ where: { id: memoryId } });
  if (!m) return null;
  if (m.encrypted && m.encryptedContent) return decryptString(m.encryptedContent);
  return m.content;
}
