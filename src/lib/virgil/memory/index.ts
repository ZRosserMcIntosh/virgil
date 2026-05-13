/**
 * VIRGIL Memory — public barrel.
 *
 * Import from here to avoid reaching into internals.
 */

export { retrieveRelevantMemories } from "./retrieve";
export { proposeMemoryWrite, detectMemoryCommand } from "./write";
export { correctMemory, forgetMemory }              from "./review";
export { logMemoryAccess, logMemoryRetrievalBatch } from "./access-log";
export { canIdentitySeeMemory }                     from "./visibility";
export { rankMemoryCandidate, extractTerms }         from "./rank";
export { formatMemoryContextBlock }                  from "./format-context";
export * from "./types";
