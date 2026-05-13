import { gmailConnector } from "@/lib/connectors/gmail";
import { ConnectorPage } from "@/components/ConnectorPage";

export default async function GmailPage() {
  const health = await gmailConnector.health();
  return <ConnectorPage title="Gmail Intelligence" connector="gmail" capabilities={gmailConnector.capabilities()} health={health} />;
}
