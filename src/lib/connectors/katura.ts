// VIRGIL — Katura connector (stub). Yen lives behind this surface.
import type { Connector, ConnectorHealth } from "./types";
export const katuraConnector: Connector = {
  name: "katura",
  capabilities: () => [
    "analytics.read", "sales.read", "leads.read", "customers.read",
    "invoices.read", "orders.read", "products.performance",
    "checkout.funnel", "yen.activity", "ai.spend",
  ] as const,
  async health(): Promise<ConnectorHealth> {
    return { ok: false, configured: false, detail: "Connector not yet implemented." };
  },
};
