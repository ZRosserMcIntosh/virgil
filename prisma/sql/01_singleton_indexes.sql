-- VIRGIL — Singleton enforcement.
--
-- Prisma cannot express partial unique indexes in schema.prisma as of v5,
-- so we enforce "exactly one OWNER" and "at most one PEPPER" via raw indexes.
-- Apply with: psql $DIRECT_URL -f prisma/sql/01_singleton_indexes.sql
-- (Also works as a Prisma migration if you `prisma migrate dev --create-only`
--  and paste this in.)

CREATE UNIQUE INDEX IF NOT EXISTS "User_one_owner"
  ON "User" ("identity")
  WHERE "identity" = 'OWNER';

CREATE UNIQUE INDEX IF NOT EXISTS "User_one_pepper"
  ON "User" ("identity")
  WHERE "identity" = 'PEPPER';

-- LockdownState is a singleton; there is exactly one row, id = 'LOCKDOWN'.
-- The PK already enforces uniqueness; this is just a guardrail check.
ALTER TABLE "LockdownState"
  DROP CONSTRAINT IF EXISTS "LockdownState_singleton_check";
ALTER TABLE "LockdownState"
  ADD CONSTRAINT "LockdownState_singleton_check" CHECK (id = 'LOCKDOWN');
