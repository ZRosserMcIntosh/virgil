/**
 * VIRGIL Memory — shared types.
 *
 * Import from here, never from Prisma enums directly, so callers are
 * insulated from schema renames.
 */

import type {
  MemoryCategory,
  SensitivityLevel,
  MemoryRetrievalRole,
  IdentityType,
} from "@prisma/client";

export type { MemoryCategory, SensitivityLevel, MemoryRetrievalRole, IdentityType };

export interface MemoryQuery {
  input: string;
  userId: string | null;
  identity: IdentityType;
  isOwner: boolean;
  isPepper: boolean;
  pepperRung: number;
  projectId?: string;
  projectSlug?: string;
  categories?: MemoryCategory[];
  maxResults?: number;
  includeSacred?: boolean;           // owner-only; forces local route when true
  role: MemoryRetrievalRole;
}

export interface RetrievedMemory {
  id: string;
  title: string;
  content: string;
  summary: string | null;
  category: MemoryCategory;
  sensitivity: SensitivityLevel;
  importance: number;
  confidence: number;
  projectId: string | null;
  personRef: string | null;
  source: string | null;
  sourceType: string | null;
  createdAt: Date;
  updatedAt: Date;
  score: number;
  reason: string;
}

export interface MemoryContextBlock {
  text: string;
  memoryIds: string[];
  sensitivityCeiling: SensitivityLevel;
  /** True if any retrieved memory must not go to a cloud provider. */
  requiresLocalRoute: boolean;
}

// Sensitivity ordering for ceiling calculation.
const SENSITIVITY_ORDER: SensitivityLevel[] = [
  "PUBLIC",
  "BUSINESS_INTERNAL",
  "BUSINESS_CONFIDENTIAL",
  "PERSONAL_PRIVATE",
  "PERSONAL_SACRED",
  "SECURITY_SECRET",
  "NEVER_SEND_TO_CLOUD",
];

export function maxSensitivity(a: SensitivityLevel, b: SensitivityLevel): SensitivityLevel {
  return SENSITIVITY_ORDER.indexOf(a) >= SENSITIVITY_ORDER.indexOf(b) ? a : b;
}

export const NEVER_CLOUD_SENSITIVITIES: SensitivityLevel[] = [
  "PERSONAL_SACRED",
  "SECURITY_SECRET",
  "NEVER_SEND_TO_CLOUD",
];

export function isNeverCloud(level: SensitivityLevel): boolean {
  return NEVER_CLOUD_SENSITIVITIES.includes(level);
}

// Token budgets per identity.
export const TOKEN_BUDGET: Record<IdentityType, number> = {
  OWNER:     1800,
  PEPPER:    800,
  DELEGATE:  700,
  GUEST:     0,
  STRANGER:  0,
  ADVERSARY: 0,
};
