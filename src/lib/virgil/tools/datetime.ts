/**
 * Tool: get_current_datetime
 *
 * Returns date, time, day of week, and timezone.
 * No API key required. Runs on the server.
 */

import type { ToolDefinition, ToolCall, ToolResult } from "./types";

export const datetimeTool: ToolDefinition = {
  name: "get_current_datetime",
  description:
    "Returns the current date, time, day of the week, and timezone. " +
    "Use when the user asks what day it is, what time it is, or for any " +
    "scheduling or date-relative calculation.",
  parameters: {
    type: "object",
    properties: {
      timezone: {
        type: "string",
        description: "IANA timezone string, e.g. 'America/Sao_Paulo'. Defaults to server local if omitted.",
      },
    },
  },
};

export async function executeDatetime(call: ToolCall): Promise<ToolResult> {
  const tz = (call.arguments.timezone as string | undefined) ?? "America/Sao_Paulo";

  try {
    const now = new Date();
    const formatter = new Intl.DateTimeFormat("en-US", {
      timeZone: tz,
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
    });

    const parts = Object.fromEntries(
      formatter.formatToParts(now).map((p) => [p.type, p.value])
    );

    const result = {
      datetime: formatter.format(now),
      date: `${parts.year}-${String(now.toLocaleDateString("en-US", { timeZone: tz, month: "2-digit" })).padStart(2, "0")}-${String(now.toLocaleDateString("en-US", { timeZone: tz, day: "2-digit" })).padStart(2, "0")}`,
      dayOfWeek: parts.weekday,
      time: `${parts.hour}:${parts.minute}`,
      timezone: tz,
      isoUtc: now.toISOString(),
    };

    return {
      toolCallId: call.id,
      name: call.name,
      content: JSON.stringify(result),
      isError: false,
    };
  } catch (err: any) {
    return {
      toolCallId: call.id,
      name: call.name,
      content: `Error: ${err?.message ?? "Unknown error"}`,
      isError: true,
    };
  }
}
