/**
 * VIRGIL — Model router.
 *
 * Maps task class -> provider+model. Sensitivity overrides routing:
 * never-cloud or local-only categories force the local/mock path.
 */

import type { SensitivityLevel } from "./types";
import type { ProviderRequest } from "./provider-adapter";

export type ModelTaskClass =
  | "ROUTING"
  | "EXTRACTION"
  | "SUMMARY"
  | "CORE_ASSISTANT"
  | "CLIENT_WRITING"
  | "HIGH_STAKES"
  | "SECURITY_REVIEW"
  | "MEMORY_WRITE"
  | "CODE_ANALYSIS"
  | "PERSONAL_ADVICE";

interface RouteSpec {
  provider: ProviderRequest["provider"];
  model: string;
}

// Defaults skewed toward mock until keys are present at runtime.
// Real provider selection happens in `routeModel` based on env.
const PREFERRED: Record<ModelTaskClass, { cloud: RouteSpec; local: RouteSpec }> = {
  ROUTING:         { cloud: { provider: "openai",    model: "gpt-4o-mini" },         local: { provider: "local", model: "llama-3.1-8b" } },
  EXTRACTION:      { cloud: { provider: "openai",    model: "gpt-4o-mini" },         local: { provider: "local", model: "llama-3.1-8b" } },
  SUMMARY:         { cloud: { provider: "openai",    model: "gpt-4o-mini" },         local: { provider: "local", model: "llama-3.1-8b" } },
  CORE_ASSISTANT:  { cloud: { provider: "openai",    model: "gpt-4o" },              local: { provider: "local", model: "llama-3.1-70b" } },
  CLIENT_WRITING:  { cloud: { provider: "anthropic", model: "claude-3-5-sonnet" },   local: { provider: "local", model: "llama-3.1-70b" } },
  HIGH_STAKES:     { cloud: { provider: "anthropic", model: "claude-3-5-sonnet" },   local: { provider: "local", model: "llama-3.1-70b" } },
  SECURITY_REVIEW: { cloud: { provider: "anthropic", model: "claude-3-5-sonnet" },   local: { provider: "local", model: "llama-3.1-70b" } },
  MEMORY_WRITE:    { cloud: { provider: "openai",    model: "gpt-4o-mini" },         local: { provider: "local", model: "llama-3.1-8b" } },
  CODE_ANALYSIS:   { cloud: { provider: "openai",    model: "gpt-4o" },              local: { provider: "local", model: "code-llama" } },
  PERSONAL_ADVICE: { cloud: { provider: "anthropic", model: "claude-3-5-sonnet" },   local: { provider: "local", model: "llama-3.1-70b" } },
};

export interface RouteDecision {
  spec: RouteSpec;
  forcedLocal: boolean;
  reason: string;
}

export function routeModel(
  taskClass: ModelTaskClass,
  sensitivity: SensitivityLevel,
  cloudAllowed: boolean,
): RouteDecision {
  const pref = PREFERRED[taskClass];
  const localOnly = process.env.VIRGIL_LOCAL_ONLY === "true";

  const mustBeLocal =
    localOnly ||
    !cloudAllowed ||
    sensitivity === "SECURITY_SECRET" ||
    sensitivity === "NEVER_SEND_TO_CLOUD" ||
    sensitivity === "PERSONAL_SACRED";

  if (mustBeLocal) {
    return {
      spec: pref.local,
      forcedLocal: true,
      reason: localOnly
        ? "VIRGIL_LOCAL_ONLY policy."
        : `Sensitivity ${sensitivity} forces local execution.`,
    };
  }

  // Fallback to mock if the chosen cloud provider has no key configured.
  const provider = pref.cloud.provider;
  const hasKey =
    (provider === "openai"    && !!process.env.OPENAI_API_KEY) ||
    (provider === "anthropic" && !!process.env.ANTHROPIC_API_KEY);

  if (!hasKey) {
    return {
      spec: { provider: "mock", model: pref.cloud.model + "-mock" },
      forcedLocal: false,
      reason: `${provider} not configured; using mock provider.`,
    };
  }

  return {
    spec: pref.cloud,
    forcedLocal: false,
    reason: `Routing ${taskClass} to ${provider}.`,
  };
}
