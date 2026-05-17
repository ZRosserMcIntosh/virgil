import { prisma } from "@/lib/db/client";
import ProfileSection from "@/components/ProfileSection";
import MemoryTable from "@/components/MemoryTable";

export const dynamic = "force-dynamic";

export default async function MemoryPage() {
  const [memories, rosserFacts, stellaFacts] = await Promise.all([
    prisma.memory.findMany({
      orderBy: [{ importance: "desc" }, { updatedAt: "desc" }],
      take: 50,
    }),
    prisma.profileFact.findMany({
      where: { subject: "ROSSER" },
      orderBy: [{ category: "asc" }, { sortOrder: "asc" }, { createdAt: "asc" }],
    }),
    prisma.profileFact.findMany({
      where: { subject: "STELLA" },
      orderBy: [{ category: "asc" }, { sortOrder: "asc" }, { createdAt: "asc" }],
    }),
  ]);

  const tableRows = memories.map((m) => ({
    id:              m.id,
    title:           m.title,
    category:        m.category,
    sensitivity:     m.sensitivity,
    importance:      m.importance,
    cloudAllowed:    m.cloudAllowed,
    neverSendToCloud: m.neverSendToCloud,
    encrypted:       m.encrypted,
    updatedAt:       m.updatedAt.toISOString(),
  }));

  return (
    <div className="space-y-8">
      <header>
        <div className="v-label">Protected Memory</div>
        <h1 className="mt-1 font-serif text-3xl text-bone-50">Memory</h1>
        <p className="mt-1 text-xs text-bone-400">
          Sensitive entries are encrypted at rest. Items marked &ldquo;never cloud&rdquo; are
          excluded from any external model call.
        </p>
      </header>

      <ProfileSection subject="ROSSER" initialFacts={rosserFacts as any} />
      <ProfileSection subject="STELLA" initialFacts={stellaFacts as any} />

      <div>
        <div className="v-label mb-3">Memory Ledger</div>
        <MemoryTable initialRows={tableRows} />
      </div>
    </div>
  );
}
