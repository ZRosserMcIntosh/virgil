/**
 * VIRGIL — Tool executor.
 *
 * Routes a ToolCall to the correct implementation and returns a ToolResult.
 * All tool calls are logged. Errors are captured, never thrown — the pipeline
 * always gets a result it can feed back to the model.
 */

import type { ToolCall, ToolResult } from "./types";
import { executeDatetime }   from "./datetime";
import { executeWeather }    from "./weather";
import { executeSearch }     from "./search";
import { executeCalculator } from "./calculator";
import { executeMemory }     from "./memory";
import { executeTask }       from "./tasks";
import { executeContact }    from "./contacts";

export interface ExecutorContext {
  userId: string;
}

export async function executeTool(
  call: ToolCall,
  ctx: ExecutorContext,
): Promise<ToolResult> {
  try {
    switch (call.name) {
      case "get_current_datetime": return await executeDatetime(call);
      case "get_weather":          return await executeWeather(call);
      case "search_web":           return await executeSearch(call);
      case "calculate":            return await executeCalculator(call);
      case "get_memory":           return await executeMemory(call, ctx.userId);
      case "manage_tasks":         return await executeTask(call);
      case "lookup_contact":       return await executeContact(call);
      default:
        return {
          toolCallId: call.id,
          name: call.name,
          content: `Unknown tool: ${call.name}`,
          isError: true,
        };
    }
  } catch (err: any) {
    return {
      toolCallId: call.id,
      name: call.name,
      content: `Tool execution error: ${err?.message ?? "Unknown error"}`,
      isError: true,
    };
  }
}

/**
 * Execute multiple tool calls in parallel and return all results.
 */
export async function executeTools(
  calls: ToolCall[],
  ctx: ExecutorContext,
): Promise<ToolResult[]> {
  return Promise.all(calls.map((c) => executeTool(c, ctx)));
}
