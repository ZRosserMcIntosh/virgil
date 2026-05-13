// VIRGIL — GitHub connector (stub).
// TODO: wire @octokit/rest and OAuth/app credentials. v0 is unconfigured.

import type { Connector, ConnectorHealth } from "./types";

export const githubConnector: Connector = {
  name: "github",
  capabilities: () => [
    "repos.list", "commits.recent", "branches.compare",
    "pulls.review", "issues.draft", "issues.summarize",
    "workflows.failures", "deployments.recent",
    "architecture.summarize", "risk.detect",
  ] as const,
  async health(): Promise<ConnectorHealth> {
    const configured = !!process.env.GITHUB_CLIENT_ID && !!process.env.GITHUB_CLIENT_SECRET;
    return { ok: configured, configured, detail: configured ? undefined : "Credentials missing." };
  },
};
