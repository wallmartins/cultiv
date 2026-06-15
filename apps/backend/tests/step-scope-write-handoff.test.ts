import { Effect } from "effect";
import { describe, expect, it } from "vitest";
import { BackendStepScopeViolationError } from "../src/http/errors.js";
import { createStepScopeHarness, createStepScopePipeline, runScopedStep } from "./step-scope-fixtures.js";

describe("Step scope write and handoff boundaries", () => {
  it("fails when a step attempts to write unauthorized metadata into shared state", () => {
    const inputs = { briefing: "Scope-safe briefing" };
    const pipeline = createStepScopePipeline({
      steps: [{ name: "analyze", skill: "analyze" }],
      inputs
    });
    const harness = createStepScopeHarness({
      pipeline,
      stepIndex: 0,
      inputs
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
        execute: () =>
          Effect.succeed({
            output: "valid text",
            metadata: {
              leakedField: "should not enter ambient state"
            }
          })
      }
    });

    expect(result.success).toBe(false);
    const cause = Effect.runSync(harness.traceRecorder.getTrace()).steps[0]?.error?.cause;
    expect(cause).toBeInstanceOf(BackendStepScopeViolationError);
    expect(cause).toMatchObject({
      _tag: "BackendStepScopeViolationError",
      boundary: "write",
      reason: "unauthorized_metadata_write",
      field: "leakedField"
    });
  });

  it("fails handoff validation when a step produces an invalid artifact", () => {
    const inputs = { briefing: "Scope-safe briefing" };
    const pipeline = createStepScopePipeline({
      steps: [{ name: "draft", skill: "draft" }],
      inputs
    });
    const harness = createStepScopeHarness({
      pipeline,
      stepIndex: 0,
      inputs
    });

    const result = runScopedStep({
      pipeline,
      stepIndex: 0,
      contextManager: harness.scopedContextManager,
      traceRecorder: harness.traceRecorder,
      skill: {
        name: "draft",
        contract: {
          type: "transform",
          output: {
            parser: "text"
          }
        },
        execute: () =>
          Effect.succeed({
            output: { invalid: true } as unknown
          })
      }
    });

    expect(result.success).toBe(false);
    const cause = Effect.runSync(harness.traceRecorder.getTrace()).steps[0]?.error?.cause;
    expect(cause).toBeInstanceOf(BackendStepScopeViolationError);
    expect(cause).toMatchObject({
      _tag: "BackendStepScopeViolationError",
      boundary: "handoff",
      reason: "invalid_handoff_artifact",
      field: "draft"
    });
  });
});
