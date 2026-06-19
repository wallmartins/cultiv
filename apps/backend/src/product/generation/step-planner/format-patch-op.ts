import type { StepPlannerPatchOp } from "./types.js";

export function formatPatchOp(op: StepPlannerPatchOp): string {
  switch (op.type) {
    case "insertStep":
      return `insertStep:${op.step.name}:before:${op.before}`;
    case "removeStep":
      return `removeStep:${op.name}`;
    case "adjustWordTarget":
      return `adjustWordTarget:${op.min}:${op.max}`;
    default: {
      const _exhaustive: never = op;
      return _exhaustive;
    }
  }
}
