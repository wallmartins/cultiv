import type { PlannedStep } from "@my-ai-orchestrator/contracts";

export type StepPlannerPatchOp =
  | { readonly type: "insertStep"; readonly before: string; readonly step: PlannedStep }
  | { readonly type: "removeStep"; readonly name: string }
  | { readonly type: "adjustWordTarget"; readonly min: number; readonly max: number };
