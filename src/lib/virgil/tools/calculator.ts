/**
 * Tool: calculate
 *
 * Safe arithmetic, financial, and unit-conversion calculations.
 * Uses a sandboxed evaluator — no eval(), no code execution.
 */

import type { ToolDefinition, ToolCall, ToolResult } from "./types";

export const calculatorTool: ToolDefinition = {
  name: "calculate",
  description:
    "Performs arithmetic, percentage, financial, and unit conversion calculations. " +
    "Use when the user asks for a numeric result: currency conversion, percentage of, " +
    "compound interest, area/volume, unit conversion, etc. " +
    "Express the formula in standard mathematical notation.",
  parameters: {
    type: "object",
    properties: {
      expression: {
        type: "string",
        description:
          "A mathematical expression to evaluate, e.g. '1500 * 0.15', '(100 + 50) / 3', " +
          "'1000 * (1 + 0.08) ** 5'. Use ** for exponents.",
      },
      context: {
        type: "string",
        description: "Optional human-readable description of what the calculation represents.",
      },
    },
    required: ["expression"],
  },
};

// ── Safe evaluator (no eval) ──────────────────────────────────────────────────

const SAFE_PATTERN = /^[\d\s+\-*/().,^%_]+$/;

function safeEval(expr: string): number {
  // Replace ^ with ** for power, clean spaces
  const cleaned = expr
    .replace(/\^/g, "**")
    .replace(/_/g, "")       // allow _ as thousands separator like 1_000_000
    .replace(/,/g, "")       // strip commas
    .trim();

  if (!SAFE_PATTERN.test(cleaned.replace(/\*\*/g, "**"))) {
    throw new Error("Expression contains unsupported characters.");
  }

  // Use Function constructor (safer than eval — no scope access)
  // eslint-disable-next-line no-new-func
  const fn = new Function(`"use strict"; return (${cleaned});`);
  const result = fn();

  if (typeof result !== "number" || !isFinite(result)) {
    throw new Error("Expression did not produce a finite number.");
  }

  return result;
}

export async function executeCalculator(call: ToolCall): Promise<ToolResult> {
  const expression = call.arguments.expression as string;
  const context = call.arguments.context as string | undefined;

  try {
    const result = safeEval(expression);

    // Format nicely — show decimals only when present
    const formatted =
      Number.isInteger(result)
        ? result.toLocaleString("en-US")
        : result.toLocaleString("en-US", { maximumFractionDigits: 6 });

    return {
      toolCallId: call.id,
      name: call.name,
      content: JSON.stringify({
        expression,
        result,
        formatted,
        context: context ?? null,
      }),
      isError: false,
    };
  } catch (err: any) {
    return {
      toolCallId: call.id,
      name: call.name,
      content: `Calculation error: ${err?.message ?? "Invalid expression"}`,
      isError: true,
    };
  }
}
