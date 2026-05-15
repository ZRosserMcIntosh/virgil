-- ─────────────────────────────────────────────────────────────────────────────
-- 04_seed_stella_pepper.sql
--
-- Creates Stella's PEPPER user rows — one per allowed email address.
-- She can sign up using any of these emails on her first visit.
--
-- Each row is independent: whichever email she completes onboarding with
-- will have cpfHash / passwordHash / principalKeyHash set.
-- The others remain as dormant PEPPER rows (veronicaOnboarded = false).
--
-- NOTE: VERONICA_ALLOWED_EMAILS in .env / Vercel must include all four.
-- Format: email1@example.com,email2@example.com,...
--
-- Run in Supabase SQL Editor.
-- ─────────────────────────────────────────────────────────────────────────────

INSERT INTO "User" (id, email, name, identity, "veronicaOnboarded", "createdAt", "updatedAt")
VALUES
  (gen_random_uuid()::text, 'stellaemjuris@gmail.com',         'Stella', 'PEPPER', false, NOW(), NOW()),
  (gen_random_uuid()::text, 'contatoluiseagency@gmail.com',    'Stella', 'PEPPER', false, NOW(), NOW()),
  (gen_random_uuid()::text, 'stella@katura1999.com',           'Stella', 'PEPPER', false, NOW(), NOW()),
  (gen_random_uuid()::text, 'stella.barbosaaa@icloud.com',     'Stella', 'PEPPER', false, NOW(), NOW())
ON CONFLICT (email) DO NOTHING;

