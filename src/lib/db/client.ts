/**
 * Prisma client singleton.
 * Hot-reload safe in dev. Standard pattern.
 */

import { PrismaClient } from "@prisma/client";

declare global {
  // eslint-disable-next-line no-var
  var __virgilPrisma: PrismaClient | undefined;
}

export const prisma: PrismaClient =
  globalThis.__virgilPrisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalThis.__virgilPrisma = prisma;
}
