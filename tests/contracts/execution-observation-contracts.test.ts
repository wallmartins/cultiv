import { Effect } from "effect";
import { describe, expect, it } from "vitest";
import {
  decodeExecutionSseEvent,
  decodeExecutionTransition,
  ExecutionTransitionSchema
} from "../../packages/contracts/src/index.js";

describe("execution observation contracts", () => {
  it("decodes execution sse wire events", async () => {
    const event = await Effect.runPromise(
      decodeExecutionSseEvent({
        type: "progress",
        occurredAt: "2026-05-09T00:00:00.000Z",
        payload: {
          currentStep: "queued",
          stepIndex: 0,
          totalSteps: 3,
          percent: 0
        }
      })
    );

    expect(event.type).toBe("progress");
  });

  it("rejects invalid execution transitions", async () => {
    const result = await Effect.runPromise(
      Effect.either(
        decodeExecutionTransition({
          type: "started",
          executionId: "exec_1",
          occurredAt: "2026-05-09T00:00:00.000Z"
        })
      )
    );

    expect(result._tag).toBe("Left");
  });

  it("decodes completed execution transitions", async () => {
    const transition = await Effect.runPromise(
      decodeExecutionTransition({
        type: "completed",
        executionId: "exec_1",
        occurredAt: "2026-05-09T00:00:05.000Z",
        result: {
          content: "done",
          metadata: {}
        }
      })
    );

    expect(transition.type).toBe("completed");
    expect(ExecutionTransitionSchema.ast).toBeDefined();
  });
});
