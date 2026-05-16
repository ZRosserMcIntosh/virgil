import { prisma } from "@/lib/db/client";
import ProfileSection from "@/components/ProfileSection";

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
        <div className="v-card overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-ink-900 text-left text-[11px] uppercase tracking-wider text-bone-400">
              <tr>
                <th className="px-4 py-3">Title</th>
                <th className="px-4 py-3">Category</th>
                <th className="px-4 py-3">Sensitivity</th>
                <th className="px-4 py-3">Cloud</th>
                <th className="px-4 py-3">Importance</th>
                <th className="px-4 py-3">Updated</th>
              </tr>
            </thead>
            <tbody>
              {memories.length === 0 && (
                <tr>
                  <td className="px-4 py-6 text-bone-400" colSpan={6}>
                    No memory records yet.
                  </td>
                </tr>
              )}
              {memories.map((m) => (
                <tr key={m.id} className="border-t border-ink-700">
                  <td className="px-4 py-3 text-bone-50">
                    {m.title}
                    {m.encrypted && (
                      <span className="ml-2 text-[10px] text-signal-amber">encrypted</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-bone-200">{m.category}</td>
                  <td className="px-4 py-3 text-bone-200">{m.sensitivity}</td>
                  <td className="px-4 py-3 text-bone-200">
                    {m.neverSendToCloud ? (
                      <span className="text-signal-red">never</span>
                    ) : m.cloudAllowed ? (
                      <span className="text-signal-green">allowed</span>
                    ) : (
                      <span className="text-signal-amber">restricted</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-bone-200">{m.importance}</td>
                  <td className="px-4 py-3 text-bone-400">{m.updatedAt.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
