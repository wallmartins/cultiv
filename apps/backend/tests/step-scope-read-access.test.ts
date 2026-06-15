import { Cause, Effect, Exit, Option } from "effect";
import { describe, expect, it } from "vitest";
import { BackendStepScopeViolationError } from "../src/http/errors.js";
import { createScopedContextManager } from "../src/safety/step-scope.js";
import { createStepScopeHarness, createStepScopePipeline, runScopedStep } from "./step-scope-fixtures.js";

describe("Step scope read access", () => {
  it("allows a step to read only its permitted inputs and prior handoff artifacts", () => {
    const inputs = {
      briefing: "Scope-safe briefing",
      importedContext: "Plain imported context"
    };
    const pipeline = createStepScopePipeline({
      steps: [
        { name: "analyze", skill: "analyze" },
        { name: "draft", skill: "draft" }
      ],
      inputs
    });
    const harness = createStepScopeHarness({
      pipeline,
      stepIndex: 1,
      inputs,
      initialState: {
        analyze: "Validated handoff from previous step",
        voiceProfile: { tone: "direct" },
        voiceExamples: ["secret raw example"]
      }
    });

    const result = runScopedStep({
      pipeline,
      stepIndex: 1,
      contextManager: harness.scopedContextManager,
      traceRecorder: harness.traceRecorder,
      skill: {
        name: "draft",
        contract: {
          type: "transform",
          input: {
            required: ["$inputs.briefing", "$state.analyze"]
          },
          output: {
            parser: "text"
          }
        },
        execute: (context) =>
          Effect.succeed({
            output: `${context.inputs.briefing} | ${context.state.analyze} | ${(context.state.voiceProfile as { tone: string }).tone}`
          })
      }
    });

    expect(result.success).toBe(true);
    expect(Effect.runSync(harness.contextManager.getState()).draft).toBe(
      "Scope-safe briefing | Validated handoff from previous step | direct"
    );
  });

  it("fails when a step attempts to read unauthorized ambient state", () => {
    const inputs = { briefing: "Scope-safe briefing" };
    const pipeline = createStepScopePipeline({
      steps: [{ name: "analyze", skill: "analyze" }],
      inputs
    });
    const harness = createStepScopeHarness({
      pipeline,
      stepIndex: 0,
      inputs,
      initialState: {
        voiceProfile: { tone: "direct" },
        voiceExamples: ["secret raw example"]
      }
    });

    const result = runScopedStep({
      pipeline,
      stepIndex: 0,
      contextManager: harness.scopedContextManager,
      traceRecorder: harness.traceRecorder,
      skill: {
        name: "analyze",
        contract: {
          type: "validate",
          output: {
            parser: "text"
          }
        },
        execute: (context) =>
          Effect.sync(() => `forbidden: ${(context.state as Record<string, unknown>).voiceExamples}`)
      }
    });

    expect(result.success).toBe(false);
    const cause = Effect.runSync(harness.traceRecorder.getTrace()).steps[0]?.error?.cause;
    expect(cause).toBeInstanceOf(BackendStepScopeViolationError);
    expect(cause).toMatchObject({
      _tag: "BackendStepScopeViolationError",
      boundary: "read",
      reason: "unauthorized_state_read",
      field: "voiceExamples"
    });
  });

  it("fails closed when a runtime step-scope contract is missing", () => {
    const pipeline = {
      name: "validation-post",
      steps: [{ name: "draft", skill: "draft" }]
    };
    const harness = createStepScopeHarness({
      pipeline,
      stepIndex: 0,
      inputs: { briefing: "Scope-safe briefing" }
    });
    const scopedContextManager = createScopedContextManager({
      contextManager: harness.contextManager,
      pipeline,
      stepIndex: 0
    });

    const result = Effect.runSyncExit(scopedContextManager.getState());

    expect(Exit.isFailure(result)).toBe(true);
    const defect = Exit.isFailure(result) ? Cause.dieOption(result.cause) : Option.none();
    expect(Option.isSome(defect)).toBe(true);
    expect(Option.isSome(defect) ? defect.value : undefined).toMatchObject({
      _tag: "BackendStepScopeViolationError",
      reason: "missing_contract"
    });
  });
});
