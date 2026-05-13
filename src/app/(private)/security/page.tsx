import { prisma } from "@/lib/db/client";
export const dynamic = "force-dynamic";

const SEV_COLOR: Record<string, string> = {
  INFO: "text-bone-300",
  LOW: "text-bone-200",
  MEDIUM: "text-signal-amber",
  HIGH: "text-signal-red",
  CRITICAL: "text-signal-red",
};

export default async function SecurityPage() {
  const [events, devices] = await Promise.all([
    prisma.securityEvent.findMany({ orderBy: { createdAt: "desc" }, take: 50 }),
    prisma.trustedDevice.findMany({ orderBy: { lastSeenAt: "desc" } }),
  ]);
  return (
    <div className="space-y-6">
      <header>
        <div className="v-label">Security</div>
        <h1 className="mt-1 font-serif text-3xl text-bone-50">Events &amp; Trusted Devices</h1>
      </header>

      <section>
        <div className="v-label mb-2">Recent Events</div>
        <div className="v-card overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-ink-900 text-left text-[11px] uppercase tracking-wider text-bone-400">
              <tr>
                <th className="px-4 py-3">Type</th>
                <th className="px-4 py-3">Severity</th>
                <th className="px-4 py-3">Summary</th>
                <th className="px-4 py-3">When</th>
              </tr>
            </thead>
            <tbody>
              {events.length === 0 && (
                <tr><td className="px-4 py-6 text-bone-400" colSpan={4}>No events recorded.</td></tr>
              )}
              {events.map((e) => (
                <tr key={e.id} className="border-t border-ink-700">
                  <td className="px-4 py-3 text-bone-100">{e.type}</td>
                  <td className={`px-4 py-3 ${SEV_COLOR[e.severity] ?? ""}`}>{e.severity}</td>
                  <td className="px-4 py-3 text-bone-200">{e.summary}</td>
                  <td className="px-4 py-3 text-bone-400">{e.createdAt.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section>
        <div className="v-label mb-2">Trusted Devices</div>
        <div className="v-card overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-ink-900 text-left text-[11px] uppercase tracking-wider text-bone-400">
              <tr>
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Trusted</th>
                <th className="px-4 py-3">First Seen</th>
                <th className="px-4 py-3">Last Seen</th>
                <th className="px-4 py-3">Revoked</th>
              </tr>
            </thead>
            <tbody>
              {devices.length === 0 && (
                <tr><td className="px-4 py-6 text-bone-400" colSpan={5}>No trusted devices yet.</td></tr>
              )}
              {devices.map((d) => (
                <tr key={d.id} className="border-t border-ink-700">
                  <td className="px-4 py-3 text-bone-100">{d.name}</td>
                  <td className={`px-4 py-3 ${d.trusted ? "text-signal-green" : "text-signal-amber"}`}>
                    {d.trusted ? "yes" : "no"}
                  </td>
                  <td className="px-4 py-3 text-bone-400">{d.firstSeenAt.toLocaleString()}</td>
                  <td className="px-4 py-3 text-bone-400">{d.lastSeenAt.toLocaleString()}</td>
                  <td className="px-4 py-3 text-bone-400">{d.revokedAt?.toLocaleString() ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
