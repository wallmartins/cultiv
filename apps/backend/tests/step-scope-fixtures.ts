import { Effect } from "effect";
import { createContextManagerService, createTraceRecorderService } from "@my-ai-orchestrator/core";
import { runStepWithRetries } from "@my-ai-orchestrator/orchestrator";
import { createBackendProductServices } from "../src/product/core/services.js";
import { attachResolvedStepScopeContracts, createScopedContextManager } from "../src/safety/step-scope.js";
import type { BackendConfig } from "../src/config/config.js";
import type { BackendPolicyEvidenceService } from "../src/safety/policy-evidence-types.js";

export const stepScopeTestConfig: BackendConfig = {
  environment: "test",
  executionMode: "sync",
  qualityMode: "balanced",
  defaultLanguage: "pt-BR",
  serviceName: "backend",
  host: "127.0.0.1",
  port: 3000,
  version: "0.1.0",
  billingPlanId: "pro",
  billingUserId: "backend"
};

export function createStepScopePipeline(args: {
  readonly steps: ReadonlyArray<{ readonly name: string; readonly skill: string }>;
  readonly inputs: Readonly<Record<string, unknown>>;
  readonly contractInputs?: Readonly<Record<string, unknown>>;
}) {
  return attachResolvedStepScopeContracts(
    {
      name: "validation-post",
      steps: [...args.steps]
    },
    args.contractInputs ?? args.inputs
  );
}

export function createStepScopeServices() {
  return Effect.runSync(
    createBackendProductServices(stepScopeTestConfig, {
      now: () => new Date("2026-06-02T00:00:00.000Z")
    })
  );
}

export function createStepScopeHarness(args: {
  readonly pipeline: ReturnType<typeof createStepScopePipeline>;
  readonly stepIndex: number;
  readonly inputs: Readonly<Record<string, unknown>>;
  readonly initialState?: Readonly<Record<string, unknown>>;
  readonly policyEvidence?: BackendPolicyEvidenceService;
}) {
  const contextManager = Effect.runSync(createContextManagerService({
    pipeline: args.pipeline,
    inputs: args.inputs,
    initialState: args.initialState
  }));
  const traceRecorder = Effect.runSync(
    createTraceRecorderService(args.pipeline, args.inputs, "test-adapter")
  );
  const scopedContextManager = createScopedContextManager({
    contextManager,
    pipeline: args.pipeline,
    stepIndex: args.stepIndex,
    policyEvidence: args.policyEvidence
  });

  return {
    contextManager,
    traceRecorder,
    scopedContextManager
  };
}

export function runScopedStep(args: {
  readonly pipeline: ReturnType<typeof createStepScopePipeline>;
  readonly stepIndex: number;
  readonly contextManager: ReturnType<typeof createStepScopeHarness>["scopedContextManager"];
  readonly traceRecorder: ReturnType<typeof createStepScopeHarness>["traceRecorder"];
  readonly skill: {
    readonly name: string;
    readonly contract: Record<string, unknown>;
    readonly execute: Parameters<typeof runStepWithRetries>[0]["skill"]["execute"];
  };
}) {
  return Effect.runSync(
    runStepWithRetries({
      step: args.pipeline.steps[args.stepIndex],
      stepIndex: args.stepIndex,
      contextManager: args.contextManager,
      traceRecorder: args.traceRecorder,
      skill: args.skill,
      retryPolicy: { maxAttempts: 1 }
    })
  );
}
