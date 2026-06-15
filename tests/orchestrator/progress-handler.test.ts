import { describe, expect, it } from "vitest";
import { Effect } from "effect";
import { toLegacyProgressCallbacks } from "../../packages/orchestrator/src/progress-handler.js";

describe("orchestrator progress handler", () => {
  it("maps legacy progress callbacks to explicit orchestration progress payloads", () => {
    const events: Array<{
      readonly type: "start" | "complete" | "error";
      readonly payload: Record<string, unknown>;
    }> = [];

    const callbacks = toLegacyProgressCallbacks({
      onStepStart: (progress) => {
        events.push({ type: "start", payload: progress });
      },
      onStepComplete: (progress) => {
        events.push({ type: "complete", payload: progress });
      },
      onStepError: (progress) => {
        events.push({ type: "error", payload: progress });
      }
    });

    expect(callbacks).toBeDefined();

    Effect.runSync(
      callbacks!.onStepStart!({
        stepName: "draft",
        stepIndex: 0,
        attempt: 1
      }) ?? Effect.void
    );

    Effect.runSync(
      callbacks!.onStepComplete!({
        stepName: "draft",
        stepIndex: 0,
        attempt: 1,
        durationMs: 120,
        status: "completed"
      }) ?? Effect.void
    );

    Effect.runSync(
      callbacks!.onStepError!({
        stepName: "draft",
        stepIndex: 0,
        attempt: 1,
        error: {
          message: "boom",
          type: "StepExecutionError"
        }
      }) ?? Effect.void
    );

    expect(events).toEqual([
      {
        type: "start",
        payload: {
          stepName: "draft",
          stepIndex: 0,
          totalSteps: 1,
          percent: 0,
          status: "running",
          skill: ""
        }
      },
      {
        type: "complete",
        payload: {
          stepName: "draft",
          stepIndex: 0,
          totalSteps: 1,
          percent: 0,
          status: "done",
          skill: "",
          durationMs: 120
        }
      },
      {
        type: "error",
        payload: {
          stepName: "draft",
          stepIndex: 0,
          totalSteps: 1,
          percent: 0,
          status: "failed",
          skill: "",
          error: {
            message: "boom",
            type: "StepExecutionError",
            stack: undefined
          }
        }
      }
    ]);
  });
});
