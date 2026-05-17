/**
 * VIRGIL — Tool registry.
 *
 * Central list of all tools Virgil is permitted to use.
 * Import VIRGIL_TOOLS when building the OpenAI tools array.
 * Import OWNER_TOOLS for the full set available to the verified principal.
 */

import { datetimeTool }   from "./datetime";
import { weatherTool }    from "./weather";
import { searchTool }     from "./search";
import { calculatorTool } from "./calculator";
import { memoryTool }     from "./memory";
import { taskTool }       from "./tasks";
import { contactTool }    from "./contacts";
import type { ToolDefinition } from "./types";

/**
 * Tools available to the verified principal (OWNER identity).
 * All tools are permitted — no restrictions.
 */
export const OWNER_TOOLS: ToolDefinition[] = [
  datetimeTool,
  weatherTool,
  searchTool,
  calculatorTool,
  memoryTool,
  taskTool,
  contactTool,
];

/**
 * Tools available to Pepper (Stella). Subset — no memory access.
 */
export const PEPPER_TOOLS: ToolDefinition[] = [
  datetimeTool,
  weatherTool,
  calculatorTool,
];

/**
 * Tools available to delegates. Minimal.
 */
export const DELEGATE_TOOLS: ToolDefinition[] = [
  datetimeTool,
  calculatorTool,
];

/**
 * No tools for guests, strangers, or adversaries.
 */
export const GUEST_TOOLS: ToolDefinition[] = [];

/**
 * Convert a ToolDefinition to the OpenAI tools array format.
 */
export function toOpenAITools(tools: ToolDefinition[]) {
  return tools.map((t) => ({
    type: "function" as const,
    function: {
      name: t.name,
      description: t.description,
      parameters: t.parameters,
    },
  }));
}
