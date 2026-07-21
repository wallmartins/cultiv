import type { RhetoricalMode } from "@my-ai-orchestrator/contracts";

// Which rhetorical modes insert an explicit structure step before the draft (medium/long only).
// `argue` inherits the old document-decision behavior — a claim-and-trade-offs piece earns an
// explicit structure pass; the others draft directly. Keyed-by-value with every mode present, so
// adding a mode is one line and there is no unprotected fall-through.
const MODE_STRUCTURE_STEP: Record<RhetoricalMode, boolean> = {
  expound: false,
  narrate: false,
  argue: true,
  instruct: false,
  promote: false
};

export function modeUsesStructureStep(mode: RhetoricalMode): boolean {
  return MODE_STRUCTURE_STEP[mode];
}
