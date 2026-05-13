import { prisma } from "@/lib/db/client";
export const dynamic = "force-dynamic";

const STATUS_COLOR: Record<string, string> = {
  ACTIVE: "text-signal-green",
  IDLE: "text-bone-300",
  DISABLED: "text-bone-400",
  QUARANTINED: "text-signal-red",
};

export default async function AgentsPage() {
  const agents = await prisma.agent.findMany({ orderBy: { name: "asc" } });
  return (
    <div className="space-y-6">
      <header>
        <div className="v-label">Agents</div>
        <h1 className="mt-1 font-serif text-3xl text-bone-50">Subordinate Registry</h1>
        <p className="mt-1 text-xs text-bone-400">All agents report to Virgil. Virgil reports to Rosser.</p>
      </header>
      <div className="v-card overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-ink-900 text-left text-[11px] uppercase tracking-wider text-bone-400">
            <tr>
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Domain</th>
              <th className="px-4 py-3">Reports To</th>
              <th className="px-4 py-3">Access</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Last Report</th>
            </tr>
          </thead>
          <tbody>
            {agents.map((a) => (
              <tr key={a.id} className="border-t border-ink-700">
                <td className="px-4 py-3 text-bone-50">{a.name}</td>
                <td className="px-4 py-3 text-bone-200">{a.domain}</td>
                <td className="px-4 py-3 text-bone-200">{a.reportsTo ?? "—"}</td>
                <td className="px-4 py-3 text-bone-200">{a.accessLevel}/6</td>
                <td className={`px-4 py-3 ${STATUS_COLOR[a.status] ?? ""}`}>{a.status}</td>
                <td className="px-4 py-3 text-bone-400">
                  {a.lastReportAt ? a.lastReportAt.toLocaleString() : "never"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
