-- ─────────────────────────────────────────────────────────────────────────────
-- 04_seed_stella_pepper.sql
--
-- Creates Stella's PEPPER user row. After this, she can onboard via the
-- /login?p=stella page by entering her CPF and choosing a password.
--
-- NOTE: veronicaOnboarded = false means the onboarding flow will activate
-- when she first visits. She will:
--   1. Enter her CPF (verified algorithmically, then HMAC-hashed)
--   2. Choose a password (bcrypt-hashed)
--   3. Her encryption key is derived from CPF + password (PBKDF2, never stored)
--   4. Only a verification hash of the key is saved
--
-- Run in Supabase SQL Editor.
-- ─────────────────────────────────────────────────────────────────────────────

INSERT INTO "User" (
  id,
  email,
  name,
  identity,
  "veronicaOnboarded",
  "createdAt",
  "updatedAt"
)
VALUES (
  gen_random_uuid()::text,
  'stellaemjuris@gmail.com',
  'Stella',
  'PEPPER',
  false,
  NOW(),
  NOW()
)
ON CONFLICT (email) DO NOTHING;
