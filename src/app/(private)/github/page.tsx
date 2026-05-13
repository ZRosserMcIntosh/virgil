import { githubConnector } from "@/lib/connectors/github";
import { ConnectorPage } from "@/components/ConnectorPage";

export default async function GitHubPage() {
  const health = await githubConnector.health();
  return <ConnectorPage title="GitHub Intelligence" connector="github" capabilities={githubConnector.capabilities()} health={health} />;
}
