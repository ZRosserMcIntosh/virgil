/**
 * VIRGIL — Connector contract.
 *
 * All external integrations implement this. Connectors NEVER mutate Virgil
 * state directly; they emit ConnectorEvent objects that the pipeline (or
 * subordinate agent) can ingest, classify, and act upon under Rosser's rules.
 */

export type ConnectorTrust = "owner" | "internal" | "external_untrusted";

export interface ConnectorEvent<T = unknown> {
  connector: string;        // e.g. "github", "gmail"
  kind: string;             // e.g. "issue.opened", "email.received"
  occurredAt: string;       // ISO
  trust: ConnectorTrust;
  provenance: string;       // e.g. "github:repo/owner#123"
  payload: T;
}

export interface ConnectorHealth {
  ok: boolean;
  configured: boolean;
  lastSyncAt?: string;
  detail?: string;
}

export interface Connector {
  readonly name: string;
  health(): Promise<ConnectorHealth>;
  // List capabilities the connector supports — for the UI and the model router.
  capabilities(): readonly string[];
}
