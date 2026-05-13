/**
 * Prisma client singleton.
 * Hot-reload safe in dev. Standard pattern.
 *
 * Throws a clear message when DATABASE_URL is missing so Vercel logs
 * show the actual cause instead of a cryptic Prisma initialization error.
 */

import { PrismaClient } from "@prisma/client";

declare global {
  // eslint-disable-next-line no-var
  var __virgilPrisma: PrismaClient | undefined;
}

if (!process.env.DATABASE_URL) {
  throw new Error(
    "[Virgil] DATABASE_URL is not set. Set it in Vercel → Settings → Environment Variables and redeploy.",
  );
}

export const prisma: PrismaClient =
  globalThis.__virgilPrisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalThis.__virgilPrisma = prisma;
}
