-- ─────────────────────────────────────────────────────────────────────────────
-- 02_question_mode.sql
--
-- Personal Question Mode — all tables and enums.
-- Run in Supabase SQL Editor.
-- Safe to run once; will error if already applied (that's fine — it means
-- it was already run).
-- ─────────────────────────────────────────────────────────────────────────────

-- Enums
CREATE TYPE "QuestionDomain" AS ENUM (
  'COMMAND_STYLE', 'FAITH', 'FATHERHOOD', 'BUSINESS', 'RELATIONSHIPS',
  'EMOTIONAL_PATTERNS', 'HEALTH', 'RISK', 'MONEY', 'LEGAL', 'LEGACY',
  'COMMUNICATION_STYLE', 'BOUNDARIES', 'CURRENT_MISSIONS'
);

CREATE TYPE "QuestionStatus" AS ENUM (
  'UNASKED', 'ASKED', 'ANSWERED', 'DEFERRED', 'RETIRED'
);

CREATE TYPE "EmotionalWeight" AS ENUM ('LIGHT', 'MODERATE', 'HEAVY');

CREATE TYPE "QuestionTiming" AS ENUM (
  'ANYTIME', 'QUIET_MOMENT', 'EXPLICIT_PERSONAL_MODE', 'ONLY_IF_RELEVANT'
);

CREATE TYPE "QuestionGeneratedBy" AS ENUM ('SYSTEM', 'VIRGIL', 'MANUAL');

CREATE TYPE "InferenceSensitivity" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'SACRED');

CREATE TYPE "InferenceStatus" AS ENUM (
  'PENDING_REVIEW', 'APPROVED', 'EDITED', 'REJECTED', 'SAVED'
);

CREATE TYPE "SessionDepth" AS ENUM ('LIGHT', 'STANDARD', 'DEEP');

CREATE TYPE "SessionStatus" AS ENUM ('ACTIVE', 'COMPLETED', 'ABANDONED');

-- Tables
CREATE TABLE "VirgilQuestion" (
    "id"                   TEXT NOT NULL,
    "userId"               TEXT NOT NULL,
    "domain"               "QuestionDomain" NOT NULL,
    "question"             TEXT NOT NULL,
    "reason"               TEXT NOT NULL,
    "priority"             INTEGER NOT NULL DEFAULT 5,
    "emotionalWeight"      "EmotionalWeight" NOT NULL DEFAULT 'LIGHT',
    "timing"               "QuestionTiming" NOT NULL DEFAULT 'ANYTIME',
    "status"               "QuestionStatus" NOT NULL DEFAULT 'UNASKED',
    "generatedBy"          "QuestionGeneratedBy" NOT NULL DEFAULT 'SYSTEM',
    "sourceConversationId" TEXT,
    "followups"            TEXT[] DEFAULT ARRAY[]::TEXT[],
    "askedAt"              TIMESTAMP(3),
    "answeredAt"           TIMESTAMP(3),
    "createdAt"            TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"            TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "VirgilQuestion_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "VirgilQuestionAnswer" (
    "id"                    TEXT NOT NULL,
    "questionId"            TEXT NOT NULL,
    "userId"                TEXT NOT NULL,
    "answer"                TEXT NOT NULL,
    "userApprovedForMemory" BOOLEAN NOT NULL DEFAULT false,
    "userRejectedForMemory" BOOLEAN NOT NULL DEFAULT false,
    "createdAt"             TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"             TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "VirgilQuestionAnswer_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "VirgilMemoryInference" (
    "id"              TEXT NOT NULL,
    "userId"          TEXT NOT NULL,
    "questionId"      TEXT,
    "answerId"        TEXT,
    "proposedMemory"  TEXT NOT NULL,
    "category"        TEXT NOT NULL,
    "confidence"      DOUBLE PRECISION NOT NULL DEFAULT 0.8,
    "sensitivity"     "InferenceSensitivity" NOT NULL DEFAULT 'MEDIUM',
    "inferenceReason" TEXT,
    "status"          "InferenceStatus" NOT NULL DEFAULT 'PENDING_REVIEW',
    "createdAt"       TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"       TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "VirgilMemoryInference_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "VirgilProfileDomain" (
    "id"                   TEXT NOT NULL,
    "userId"               TEXT NOT NULL,
    "domain"               "QuestionDomain" NOT NULL,
    "summary"              TEXT,
    "understandingScore"   INTEGER NOT NULL DEFAULT 0,
    "confirmedMemoryCount" INTEGER NOT NULL DEFAULT 0,
    "openQuestionCount"    INTEGER NOT NULL DEFAULT 0,
    "lastUpdatedAt"        TIMESTAMP(3),
    "createdAt"            TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"            TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "VirgilProfileDomain_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "VirgilQuestionSession" (
    "id"             TEXT NOT NULL,
    "userId"         TEXT NOT NULL,
    "depth"          "SessionDepth" NOT NULL DEFAULT 'STANDARD',
    "selectedDomain" "QuestionDomain",
    "questionIds"    TEXT[] DEFAULT ARRAY[]::TEXT[],
    "startedAt"      TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt"    TIMESTAMP(3),
    "status"         "SessionStatus" NOT NULL DEFAULT 'ACTIVE',
    CONSTRAINT "VirgilQuestionSession_pkey" PRIMARY KEY ("id")
);

-- Indexes
CREATE INDEX "VirgilQuestion_userId_idx"    ON "VirgilQuestion"("userId");
CREATE INDEX "VirgilQuestion_domain_idx"    ON "VirgilQuestion"("domain");
CREATE INDEX "VirgilQuestion_status_idx"    ON "VirgilQuestion"("status");
CREATE INDEX "VirgilQuestion_priority_idx"  ON "VirgilQuestion"("priority");

CREATE INDEX "VirgilQuestionAnswer_questionId_idx" ON "VirgilQuestionAnswer"("questionId");
CREATE INDEX "VirgilQuestionAnswer_userId_idx"     ON "VirgilQuestionAnswer"("userId");

CREATE INDEX "VirgilMemoryInference_userId_idx"     ON "VirgilMemoryInference"("userId");
CREATE INDEX "VirgilMemoryInference_status_idx"     ON "VirgilMemoryInference"("status");
CREATE INDEX "VirgilMemoryInference_questionId_idx" ON "VirgilMemoryInference"("questionId");

CREATE INDEX        "VirgilProfileDomain_userId_idx"       ON "VirgilProfileDomain"("userId");
CREATE UNIQUE INDEX "VirgilProfileDomain_userId_domain_key" ON "VirgilProfileDomain"("userId", "domain");

CREATE INDEX "VirgilQuestionSession_userId_idx"  ON "VirgilQuestionSession"("userId");
CREATE INDEX "VirgilQuestionSession_status_idx"  ON "VirgilQuestionSession"("status");

-- Foreign keys
ALTER TABLE "VirgilQuestion"
  ADD CONSTRAINT "VirgilQuestion_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "VirgilQuestionAnswer"
  ADD CONSTRAINT "VirgilQuestionAnswer_questionId_fkey"
  FOREIGN KEY ("questionId") REFERENCES "VirgilQuestion"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "VirgilQuestionAnswer"
  ADD CONSTRAINT "VirgilQuestionAnswer_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "VirgilMemoryInference"
  ADD CONSTRAINT "VirgilMemoryInference_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "VirgilMemoryInference"
  ADD CONSTRAINT "VirgilMemoryInference_questionId_fkey"
  FOREIGN KEY ("questionId") REFERENCES "VirgilQuestion"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "VirgilMemoryInference"
  ADD CONSTRAINT "VirgilMemoryInference_answerId_fkey"
  FOREIGN KEY ("answerId") REFERENCES "VirgilQuestionAnswer"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "VirgilProfileDomain"
  ADD CONSTRAINT "VirgilProfileDomain_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "VirgilQuestionSession"
  ADD CONSTRAINT "VirgilQuestionSession_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
