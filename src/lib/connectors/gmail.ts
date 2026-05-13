// VIRGIL — Gmail connector (stub).
// TODO: wire Google APIs + OAuth. All inbound email content is `external_untrusted`.

import type { Connector, ConnectorHealth } from "./types";

export const gmailConnector: Connector = {
  name: "gmail",
  capabilities: () => [
    "inbox.summarize", "thread.urgent.detect", "thread.unanswered.detect",
    "reply.draft", "tasks.extract", "label.archive_lowrisk",
    "injection.scan",
  ] as const,
  async health(): Promise<ConnectorHealth> {
    const configured = !!process.env.GOOGLE_CLIENT_ID && !!process.env.GOOGLE_CLIENT_SECRET;
    return { ok: configured, configured, detail: configured ? undefined : "Credentials missing." };
  },
};
