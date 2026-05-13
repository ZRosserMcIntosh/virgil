// VIRGIL — K99 connector (stub).
import type { Connector, ConnectorHealth } from "./types";
export const k99Connector: Connector = {
  name: "k99",
  capabilities: () => [
    "codebase.read", "deploy.status", "repo.stats",
    "ai.systems.inventory", "model.routing.audit", "costs.read",
    "unfinished.systems", "technical.risks",
  ] as const,
  async health(): Promise<ConnectorHealth> {
    return { ok: false, configured: false, detail: "Connector not yet implemented." };
  },
};
