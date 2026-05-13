import { calendarConnector } from "@/lib/connectors/calendar";
import { ConnectorPage } from "@/components/ConnectorPage";

export default async function CalendarPage() {
  const health = await calendarConnector.health();
  return <ConnectorPage title="Calendar Intelligence" connector="calendar" capabilities={calendarConnector.capabilities()} health={health} />;
}
