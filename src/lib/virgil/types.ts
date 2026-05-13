/**
 * VIRGIL — shared core types.
 *
 * Mirrors the schema's identity model. The Pepper sub-axis is independent
 * from the Owner ladder: Peppers never get owner-rung escalation, ever.
 */

export type IdentityType =
  | "OWNER"
  | "PEPPER"
  | "DELEGATE"
  | "GUEST"
  | "STRANGER"
  | "ADVERSARY";

export type PepperTrust =
  | "PEPPER_BASIC"
  | "PEPPER_TRUSTED"
  | "PEPPER_HOUSEHOLD"
  | "PEPPER_PRIMARY";

export type SensitivityLevel =
  | "PUBLIC"
  | "BUSINESS_INTERNAL"
  | "BUSINESS_CONFIDENTIAL"
  | "PERSONAL_PRIVATE"
  | "PERSONAL_SACRED"
  | "SECURITY_SECRET"
  | "NEVER_SEND_TO_CLOUD";

export type RiskLevel = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";

export type ActionPhase =
  | "OBSERVE" | "ADVISE" | "PREPARE" | "STAGE" | "EXECUTE" | "CONFIRM" | "ABORT";

/** Owner permission ladder — six rungs above the stranger floor. */
export const PermissionLevel = {
  STRANGER: 0,
  UNVERIFIED_OWNER: 1,
  BASIC_AUTH: 2,
  TRUSTED_SESSION: 3,
  STRONG_VERIFIED: 4,
  EXPLICIT_APPROVAL: 5,
  HARD_APPROVAL: 6,
} as const;
export type PermissionLevelValue = (typeof PermissionLevel)[keyof typeof PermissionLevel];

/** Pepper rungs are scored separately from the owner ladder. */
export const PepperRung = {
  NONE: 0,
  BASIC: 1,
  TRUSTED: 2,
  HOUSEHOLD: 3,
  PRIMARY: 4,
} as const;
export type PepperRungValue = (typeof PepperRung)[keyof typeof PepperRung];

export interface TrustContext {
  userId: string | null;
  sessionId: string | null;
  identity: IdentityType;
  isAuthenticated: boolean;
  isOwner: boolean;
  isPepper: boolean;
  pepperRung: PepperRungValue;
  isTrustedDevice: boolean;
  voiceVerified: boolean;
  strongVerified: boolean;
  riskScore: number;       // 0..100
  authorizationLevel: PermissionLevelValue;
  ipHash?: string;
  userAgent?: string;
  /** Set true when the request must be cold-shut. */
  lockedDown: boolean;
  /** Set true when network/identity layer matched the denial list. */
  denied: boolean;
  /** Adversary score for the requester key, 0..100. */
  adversaryScore: number;
}

export interface SensitivityClassification {
  level: SensitivityLevel;
  cloudAllowed: boolean;
  requiresRedaction: boolean;
  neverSendToCloud: boolean;
  reason: string;
  confidence: number;
}

export interface VirgilRequest {
  input: string;
  source: "web" | "api" | "voice" | "agent" | "connector" | "delegate_portal";
  trustContext: TrustContext;
  requestedAction?: string;
  attachedContext?: Array<{
    kind: "memory" | "external" | "tool_output";
    content: string;
    provenance: string;
    trust: "owner" | "internal" | "external_untrusted";
  }>;
  timestamp: string;
}

export interface VirgilResponse {
  message: string;
  actionType?: string;
  pendingApprovalId?: string;
  usedTools: string[];
  usedModel?: string;
  sensitivity?: SensitivityLevel;
  auditEventId?: string;
  blackDoor?: boolean;
  lockdown?: boolean;
}

export interface PermissionDecision {
  allowed: boolean;
  requiredLevel: PermissionLevelValue;
  currentLevel: PermissionLevelValue;
  reason: string;
  requiresApproval: boolean;
  denialMessage: string;
}

export interface ApprovalAction {
  type: string;
  title: string;
  summary: string;
  payload: Record<string, unknown>;
  riskLevel: RiskLevel;
  sensitivityLevel: SensitivityLevel;
  approvalRequiredLevel: PermissionLevelValue;
  rollbackPlan?: string;
}

export interface MemoryRecordInput {
  title: string;
  content: string;
  category: string;
  sensitivity: SensitivityLevel;
  importance?: number;
  confidence?: number;
  source?: string;
  projectId?: string;
  personRef?: string;
  cloudAllowed?: boolean;
  neverSendToCloud?: boolean;
  pepperVisibility?: PepperTrust | null;
}
