import { prisma } from "@/lib/db/client";
export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const connectors = await prisma.connectorConfig.findMany({ orderBy: { kind: "asc" } });

  const flags = [
    { name: "VIRGIL_LOCAL_ONLY", value: process.env.VIRGIL_LOCAL_ONLY ?? "false" },
    { name: "VIRGIL_AUTO_BLACK_DOOR", value: process.env.VIRGIL_AUTO_BLACK_DOOR ?? "true" },
    { name: "OPENAI_API_KEY", value: process.env.OPENAI_API_KEY ? "configured" : "missing" },
    { name: "ANTHROPIC_API_KEY", value: process.env.ANTHROPIC_API_KEY ? "configured" : "missing" },
    { name: "ENCRYPTION_KEY", value: process.env.ENCRYPTION_KEY ? "configured" : "missing" },
  ];

  return (
    <div className="space-y-6">
      <header>
        <div className="v-label">Settings</div>
        <h1 className="mt-1 font-serif text-3xl text-bone-50">System Configuration</h1>
      </header>

      <section className="v-card v-card-pad">
        <div className="v-label mb-3">Operational Flags</div>
        <div className="grid grid-cols-1 gap-2 text-sm sm:grid-cols-2">
          {flags.map((f) => (
            <div key={f.name} className="flex items-center justify-between border-b border-ink-700 pb-1">
              <span className="font-mono text-[12px] text-bone-300">{f.name}</span>
              <span className="text-bone-100">{f.value}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="v-card v-card-pad">
        <div className="v-label mb-3">Connectors</div>
        {connectors.length === 0 ? (
          <div className="text-sm text-bone-400">No connector configurations stored yet.</div>
        ) : (
          <ul className="space-y-2 text-sm">
            {connectors.map((c) => (
              <li key={c.id} className="flex items-center justify-between">
                <span className="text-bone-100">{c.name} <span className="text-bone-400">({c.kind})</span></span>
                <span className={c.enabled ? "text-signal-green" : "text-bone-400"}>
                  {c.enabled ? "enabled" : "disabled"}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
