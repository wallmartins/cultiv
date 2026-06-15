import { Effect } from "effect";
import { describe, expect, it } from "vitest";
import { createContextManagerService, createTraceRecorderService } from "../../packages/core/src/index.js";
import { runStepWithRetries } from "../../packages/orchestrator/src/index.js";

describe("M1.E step execution", () => {
  it("executes a step and merges the output into context state", () => {
    const pipeline = {
      name: "validation-post",
      steps: [
        { name: "draft", skill: "draft" }
      ]
    };

    const contextManager = Effect.runSync(createContextManagerService({
      pipeline,
      inputs: { topic: "Effect" }
    }));
    const traceRecorder = Effect.runSync(createTraceRecorderService(pipeline, { topic: "Effect" }, "test-adapter"));

    const skill = {
      name: "draft",
      description: "Draft a paragraph",
      contract: {
        type: "transform" as const,
        input: {
          required: ["$inputs.topic"] as const
        }
      },
      execute: () =>
        Effect.succeed({
          output: "Draft about Effect",
          metadata: {
            source: "test"
          }
        })
    };

    const result = Effect.runSync(
      runStepWithRetries({
        step: pipeline.steps[0],
        stepIndex: 0,
        contextManager,
        traceRecorder,
        skill,
        retryPolicy: { maxAttempts: 1 }
      })
    );

    expect(result.success).toBe(true);
    expect(result.finalAttempt).toBe(1);
    expect(Effect.runSync(contextManager.getState()).draft).toBe("Draft about Effect");
    expect(Effect.runSync(contextManager.getState()).source).toBe("test");
    expect(Effect.runSync(traceRecorder.getTrace()).steps[0]?.output).toBe("Draft about Effect");
  });

  it("reports missing required inputs without throwing", () => {
    const pipeline = {
      name: "validation-post",
      steps: [
        { name: "draft", skill: "draft" }
      ]
    };

    const contextManager = Effect.runSync(createContextManagerService({
      pipeline,
      inputs: {}
    }));
    const traceRecorder = Effect.runSync(createTraceRecorderService(pipeline, {}, "test-adapter"));

    const skill = {
      name: "draft",
      description: "Draft a paragraph",
      contract: {
        type: "transform" as const,
        input: {
          required: ["$inputs.topic"] as const
        }
      },
      execute: () =>
        Effect.succeed({
          output: "unused"
        })
    };

    const result = Effect.runSync(
      runStepWithRetries({
        step: pipeline.steps[0],
        stepIndex: 0,
        contextManager,
        traceRecorder,
        skill,
        retryPolicy: { maxAttempts: 1 }
      })
    );

    expect(result.success).toBe(false);
    expect(result.finalAttempt).toBe(1);
    expect(Effect.runSync(traceRecorder.getTrace()).steps[0]?.error?.message).toContain("Missing required inputs");
  });
});
