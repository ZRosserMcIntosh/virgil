/**
 * VIRGIL — Database seed.
 *
 * Idempotent. Establishes:
 *   - Singleton OWNER user (Rosser).
 *   - LockdownState singleton row, disengaged.
 *   - Three seed projects (Katura, K99, Maverick).
 *   - Owner-level baseline memories.
 *   - System boot security event.
 *
 * Pepper slot is intentionally left empty — created by Rosser
 * through the admin UI, exactly once, never seeded.
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const ownerEmail = process.env.VIRGIL_OWNER_EMAIL ?? "rosser@example.com";

  // ── 1. Lockdown singleton ──────────────────────────────────────────────────
  await prisma.lockdownState.upsert({
    where:  { id: "LOCKDOWN" },
    update: {},
    create: { id: "LOCKDOWN", engaged: false },
  });

  // ── 2. Owner ───────────────────────────────────────────────────────────────
  const owner = await prisma.user.upsert({
    where:  { email: ownerEmail },
    update: { identity: "OWNER", suspended: false },
    create: {
      email:     ownerEmail,
      name:      "Rosser McIntosh",
      identity:  "OWNER",
      suspended: false,
    },
  });

  // ── 3. Projects ────────────────────────────────────────────────────────────
  const projects = [
    { slug: "katura",   name: "Katura",   description: "Wholesale carbide tooling, B2B." },
    { slug: "k99",      name: "K99",      description: "Tooling SaaS — sourcing + lifecycle." },
    { slug: "maverick", name: "Maverick", description: "Education company — student journey." },
  ];

  for (const p of projects) {
    await prisma.project.upsert({
      where:  { slug: p.slug },
      update: { name: p.name, description: p.description },
      create: { ...p, ownerId: owner.id },
    });
  }

  // ── 4. Baseline memories ───────────────────────────────────────────────────
  const seedMemories = [
    {
      title:       "Operating principle: prepared, not executed",
      content:     "Never act on Rosser's behalf without explicit confirmation. Stage; do not send.",
      category:    "WORKING_STYLE" as const,
      sensitivity: "BUSINESS_INTERNAL" as const,
      importance:  90,
    },
    {
      title:       "Voice posture",
      content:     "Address Rosser as 'sir'. Calm, dry, concise. No hype.",
      category:    "WORKING_STYLE" as const,
      sensitivity: "PERSONAL_PRIVATE" as const,
      importance:  85,
    },
  ];

  for (const m of seedMemories) {
    const exists = await prisma.memory.findFirst({
      where: { ownerId: owner.id, title: m.title },
    });
    if (!exists) {
      await prisma.memory.create({
        data: {
          ownerId:         owner.id,
          title:           m.title,
          content:         m.content,
          category:        m.category,
          sensitivity:     m.sensitivity,
          importance:      m.importance,
          confidence:      95,
          source:          "seed",
          pepperVisibility: null,
        },
      });
    }
  }

  // ── 5. System boot event ───────────────────────────────────────────────────
  await prisma.securityEvent.create({
    data: {
      type:     "SYSTEM_BOOT",
      severity: "LOW",
      summary:  "Virgil seeded. Lockdown disengaged. Owner installed. Pepper slot empty.",
    },
  });

  console.log("✓ Seed complete. Owner:", owner.email);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
