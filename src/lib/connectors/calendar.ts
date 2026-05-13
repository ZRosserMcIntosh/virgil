// VIRGIL — Google Calendar connector (stub).
import type { Connector, ConnectorHealth } from "./types";

export const calendarConnector: Connector = {
  name: "calendar",
  capabilities: () => [
    "schedule.read", "conflicts.detect", "workblocks.find",
    "event.prepare", "event.schedule.with_approval", "deadlines.remind",
  ] as const,
  async health(): Promise<ConnectorHealth> {
    const configured = !!process.env.GOOGLE_CLIENT_ID && !!process.env.GOOGLE_CLIENT_SECRET;
    return { ok: configured, configured, detail: configured ? undefined : "Credentials missing." };
  },
};
