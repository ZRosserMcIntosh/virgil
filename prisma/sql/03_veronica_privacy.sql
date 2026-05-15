-- ─────────────────────────────────────────────────────────────────────────────
-- 03_veronica_privacy.sql
--
-- Veronica Privacy Architecture:
--   - New columns on User for Stella's cryptographic credentials
--   - VeronicaPrivacyAudit — HMAC-signed access log (verifiable by Stella only)
--   - VeronicaConversation — encrypted conversation storage (AES-256-GCM)
--   - VeronicaMemory — encrypted memory storage (AES-256-GCM)
--
-- CRITICAL DESIGN NOTE:
--   The columns cpfHash, passwordHash, and principalKeyHash do NOT store
--   plaintext credentials or the encryption key itself. They store:
--     cpfHash          — HMAC-SHA256 of CPF with server pepper (irreversible)
--     passwordHash     — bcrypt hash of password (irreversible)
--     principalKeyHash — SHA-256 of the DERIVED key (for login verification only)
--
--   The encryption key that protects Stella's data is derived at login from
--   CPF + password via PBKDF2 and lives ONLY in the encrypted JWT session.
--   It is never written to the database. Even with full DB access, the data
--   cannot be decrypted without Stella's credentials.
--
-- Run in Supabase SQL Editor.
-- ─────────────────────────────────────────────────────────────────────────────

-- Add Veronica-specific columns to User
ALTER TABLE "User"
  ADD COLUMN "cpfHash"           TEXT,
  ADD COLUMN "passwordHash"      TEXT,
  ADD COLUMN "principalKeyHash"  TEXT,
  ADD COLUMN "veronicaOnboarded" BOOLEAN NOT NULL DEFAULT false;

-- VeronicaPrivacyAudit
-- Every access to Stella's data is logged here.
-- Entries are signed with her derived key — she can verify them independently.
-- Nobody can forge a valid signature without her key.
CREATE TABLE "VeronicaPrivacyAudit" (
    "id"        TEXT NOT NULL,
    "userId"    TEXT NOT NULL,
    "action"    TEXT NOT NULL,  -- DECRYPT | QUERY | LOGIN | KEY_DERIVE | CONVERSATION_STORE
    "detail"    TEXT NOT NULL,
    "ipHash"    TEXT,           -- hashed IP, never raw
    "signature" TEXT,           -- HMAC-SHA256 signed with Stella's derived key
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "VeronicaPrivacyAudit_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "VeronicaPrivacyAudit_userId_idx"    ON "VeronicaPrivacyAudit"("userId");
CREATE INDEX "VeronicaPrivacyAudit_createdAt_idx" ON "VeronicaPrivacyAudit"("createdAt");
CREATE INDEX "VeronicaPrivacyAudit_action_idx"    ON "VeronicaPrivacyAudit"("action");

ALTER TABLE "VeronicaPrivacyAudit"
  ADD CONSTRAINT "VeronicaPrivacyAudit_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- VeronicaConversation
-- All content is AES-256-GCM ciphertext encrypted with Stella's key.
-- The server cannot read this. The admin cannot read this.
-- Decryption requires Stella's CPF + password.
CREATE TABLE "VeronicaConversation" (
    "id"               TEXT NOT NULL,
    "userId"           TEXT NOT NULL,
    "encryptedContent" TEXT NOT NULL,   -- AES-256-GCM ciphertext (base64)
    "encryptedSummary" TEXT,            -- encrypted summary (base64)
    "searchHash"       TEXT,            -- deterministic keyword hash (no plaintext)
    "tokenEstimate"    INTEGER NOT NULL DEFAULT 0,
    "createdAt"        TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "VeronicaConversation_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "VeronicaConversation_userId_idx"    ON "VeronicaConversation"("userId");
CREATE INDEX "VeronicaConversation_createdAt_idx" ON "VeronicaConversation"("createdAt");

-- VeronicaMemory
-- Same encryption model as conversations.
-- category and sensitivityLevel are stored in plaintext for filtering
-- but contain no sensitive information themselves.
CREATE TABLE "VeronicaMemory" (
    "id"               TEXT NOT NULL,
    "userId"           TEXT NOT NULL,
    "encryptedTitle"   TEXT NOT NULL,   -- AES-256-GCM ciphertext (base64)
    "encryptedContent" TEXT NOT NULL,   -- AES-256-GCM ciphertext (base64)
    "category"         TEXT NOT NULL,
    "sensitivityLevel" TEXT NOT NULL DEFAULT 'PERSONAL_PRIVATE',
    "importance"       INTEGER NOT NULL DEFAULT 50,
    "status"           TEXT NOT NULL DEFAULT 'ACTIVE',
    "createdAt"        TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"        TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "VeronicaMemory_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "VeronicaMemory_userId_idx"    ON "VeronicaMemory"("userId");
CREATE INDEX "VeronicaMemory_category_idx"  ON "VeronicaMemory"("category");
CREATE INDEX "VeronicaMemory_status_idx"    ON "VeronicaMemory"("status");
CREATE INDEX "VeronicaMemory_createdAt_idx" ON "VeronicaMemory"("createdAt");

-- ─────────────────────────────────────────────────────────────────────────────
-- After running this migration, create Stella's PEPPER user row:
--
-- INSERT INTO "User" (id, email, name, identity, "veronicaOnboarded", "createdAt", "updatedAt")
-- VALUES (
--   gen_random_uuid(),
--   'stella@example.com',   -- replace with real email
--   'Stella',
--   'PEPPER',
--   false,
--   NOW(),
--   NOW()
-- );
--
-- Then set in Vercel environment variables:
--   VERONICA_PRINCIPAL_EMAIL = stella@example.com
--   VERONICA_CPF_PEPPER      = <random 32+ char string>
-- ─────────────────────────────────────────────────────────────────────────────
