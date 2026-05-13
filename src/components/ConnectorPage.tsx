import type { ConnectorHealth } from "@/lib/connectors/types";

interface Props {
  title: string;
  connector: string;
  capabilities: readonly string[];
  health: ConnectorHealth;
}

export function ConnectorPage({ title, connector, capabilities, health }: Props) {
  return (
    <div className="space-y-6">
      <header>
        <div className="v-label">{connector}</div>
        <h1 className="mt-1 font-serif text-3xl text-bone-50">{title}</h1>
      </header>

      <div className="v-card v-card-pad">
        <div className="flex items-center justify-between">
          <div>
            <div className="v-label">Connector Status</div>
            <div className="mt-1 text-bone-100">
              {health.configured ? "Configured" : "Not configured"}
              {health.detail ? <span className="ml-2 text-bone-400">— {health.detail}</span> : null}
            </div>
          </div>
          <div className={`text-[11px] uppercase tracking-wider ${health.ok ? "text-signal-green" : "text-signal-amber"}`}>
            {health.ok ? "ready" : "offline"}
          </div>
        </div>
      </div>

      <div className="v-card v-card-pad">
        <div className="v-label mb-3">Designed Capabilities</div>
        <ul className="grid grid-cols-1 gap-1 text-sm text-bone-200 sm:grid-cols-2">
          {capabilities.map((c) => (
            <li key={c} className="font-mono text-[12px]">— {c}</li>
          ))}
        </ul>
        <p className="mt-4 text-[11px] text-bone-400">
          Connector implementation pending. All inbound content from this surface is treated
          as untrusted external data and screened for prompt injection before reaching any model.
        </p>
      </div>
    </div>
  );
}
