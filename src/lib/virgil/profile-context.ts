/**
 * VIRGIL — Profile context builder.
 *
 * Formats ProfileFact records into a compact system-prompt block
 * so Virgil knows what it actually knows about Sir and, where permitted,
 * about Stella.
 *
 * This is injected into the OWNER branch of the system prompt.
 * It is NOT retrieved memory — it is structured fact context.
 * It cannot be overridden by user input.
 */

import { prisma } from "@/lib/db/client";

export interface ProfileContextBlock {
  rosser: string;   // Formatted block for Rosser facts
  stella: string;   // Formatted block for Stella V-visible facts
  combined: string; // Both joined — injected into system prompt
}

/**
 * Builds a formatted context block from all ProfileFacts.
 * Rosser facts: all of them.
 * Stella facts: only veronicaVisible=true (permitted for Virgil).
 * Called once per pipeline request; lightweight — facts are small records.
 */
export async function buildProfileContext(): Promise<ProfileContextBlock> {
  const [rosserFacts, stellaFacts] = await Promise.all([
    prisma.profileFact.findMany({
      where: { subject: "ROSSER" },
      orderBy: [{ category: "asc" }, { sortOrder: "asc" }, { createdAt: "asc" }],
    }),
    prisma.profileFact.findMany({
      where: { subject: "STELLA", veronicaVisible: true },
      orderBy: [{ category: "asc" }, { sortOrder: "asc" }, { createdAt: "asc" }],
    }),
  ]);

  if (rosserFacts.length === 0 && stellaFacts.length === 0) {
    return { rosser: "", stella: "", combined: "" };
  }

  const lines: string[] = [];

  if (rosserFacts.length > 0) {
    lines.push("━━━ PROFILE: MR. McINTOSH (structured facts — non-negotiable background) ━━━");
    lines.push("These are facts about Sir. Use them naturally when relevant. Do not recite them unprompted.");
    lines.push("");

    // Group by category
    const byCategory = groupByCategory(rosserFacts);
    for (const [cat, facts] of byCategory) {
      lines.push(`[${cat.toUpperCase()}]`);
      for (const f of facts) {
        lines.push(`  ${f.label}: ${f.value}`);
      }
    }
    lines.push("━━━ END MR. McINTOSH PROFILE ━━━");
  }

  if (stellaFacts.length > 0) {
    lines.push("");
    lines.push("━━━ PROFILE: MS. BARBOSA (shared facts — use with care and respect) ━━━");
    lines.push("These are facts about Ms. Barbosa that Sir has explicitly marked as shared context.");
    lines.push("Use them only when directly relevant. Do not volunteer them. Treat with full discretion.");
    lines.push("");

    const byCategory = groupByCategory(stellaFacts);
    for (const [cat, facts] of byCategory) {
      lines.push(`[${cat.toUpperCase()}]`);
      for (const f of facts) {
        lines.push(`  ${f.label}: ${f.value}`);
      }
    }
    lines.push("━━━ END MS. BARBOSA PROFILE ━━━");
  }

  const combined = lines.join("\n");

  return {
    rosser: rosserFacts.length > 0 ? lines.slice(0, lines.findIndex((l) => l.startsWith("━━━ END MR.")) + 1).join("\n") : "",
    stella: stellaFacts.length > 0 ? lines.slice(lines.findIndex((l) => l.includes("MS. BARBOSA"))).join("\n") : "",
    combined,
  };
}

function groupByCategory<T extends { category: string }>(facts: T[]): Map<string, T[]> {
  const map = new Map<string, T[]>();
  for (const f of facts) {
    if (!map.has(f.category)) map.set(f.category, []);
    map.get(f.category)!.push(f);
  }
  return map;
}
