import type { Pipeline as RuntimePipeline } from "@my-ai-orchestrator/core";

export interface BackendStepScopeReadContract {
  readonly inputKeys: readonly string[];
  readonly stateKeys: readonly string[];
}

export interface BackendStepScopeWriteContract {
  readonly outputKey: string;
  readonly metadataKeys: readonly string[];
}

export interface BackendStepScopeHandoffContract {
  readonly outputKind: "text";
  readonly requireNonEmpty: boolean;
}

export interface BackendStepScopeContract {
  readonly stepName: string;
  readonly reads: BackendStepScopeReadContract;
  readonly writes: BackendStepScopeWriteContract;
  readonly handoff: BackendStepScopeHandoffContract;
}

export type BackendScopedRuntimeStep = RuntimePipeline["steps"][number] & {
  readonly config?: Readonly<Record<string, unknown>> & {
    readonly stepScope?: BackendStepScopeContract;
  };
};
