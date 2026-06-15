import { Effect } from "effect";
import { describe, expect, it } from "vitest";
import { createContextManagerService, createTraceRecorderService } from "../../packages/core/src/index.js";

describe("M1.E core runtime", () => {
  it("tracks context state, interpolation and trace events", () => {
    const pipeline = {
      name: "validation-post",
      steps: [
        { name: "draft", skill: "draft" },
        { name: "refine", skill: "refine" }
      ]
    };

    const contextManager = Effect.runSync(createContextManagerService({
      pipeline,
      inputs: { topic: "Effect" },
      initialState: {
        draft: "Initial draft"
      }
    }));
    const traceRecorder = Effect.runSync(createTraceRecorderService(pipeline, { topic: "Effect" }, "test-adapter"));

    expect(Effect.runSync(contextManager.get("draft"))).toBe("Initial draft");

    Effect.runSync(contextManager.mergeOutput({ output: "updated draft" }));
    expect(Effect.runSync(contextManager.get("draft"))).toBe("updated draft");

    Effect.runSync(traceRecorder.startStep(pipeline.steps[0], { draft: "updated draft" }, 1));
    Effect.runSync(traceRecorder.recordOutput("updated draft"));
    Effect.runSync(traceRecorder.recordEvent({
      type: "step-complete",
      stepIndex: 0,
      stepName: "draft",
      skill: "draft",
      attempt: 1,
      status: "completed"
    }));

    const trace = Effect.runSync(traceRecorder.complete());
    expect(trace.status).toBe("completed");
    expect(trace.steps[0]?.output).toBe("updated draft");
    expect(trace.events?.[0]?.type).toBe("step-complete");
  });
});
