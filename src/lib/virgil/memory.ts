/**
 * VIRGIL Memory — barrel export.
 *
 * Re-exports the public surface of the memory subsystem so pipeline.ts
 * and other callers can import from `./memory` without knowing the
 * internal file layout.
 */

export { retrieveRelevantMemories } from "./memory/retrieve";
export { maxSensitivity, isNeverCloud } from "./memory/types";
export type { MemoryQuery, MemoryContextBlock, RetrievedMemory } from "./memory/types";
