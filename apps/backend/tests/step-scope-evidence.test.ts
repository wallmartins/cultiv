import { Effect } from "effect";
import { describe, expect, it } from "vitest";
import { createStepScopeHarness, createStepScopePipeline, createStepScopeServices, runScopedStep } from "./step-scope-fixtures.js";

describe("Step scope evidence", () => {
  it("emits scope evidence for proxy-based unauthorized state reads", () => {
    const services = createStepScopeServices();
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
        voiceExamples: ["secret raw example"]
      },
      policyEvidence: services.policyEvidence
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

    const evidence = Effect.runSync(
      services.policyEvidence.listOperationalEvidence({ boundary: "scope", outcome: "block" })
    );
    expect(evidence.some((entry) =>
      entry.boundary === "scope" &&
      entry.outcome === "block" &&
      entry.rationaleCategory === "unauthorized_state_read" &&
      entry.summary?.includes("voiceExamples")
    )).toBe(true);
  });

  it("emits scope evidence for proxy-based unauthorized input reads", () => {
    const services = createStepScopeServices();
    const inputs = {
      briefing: "Scope-safe briefing",
      forbiddenInput: "top-secret input"
    };
    const pipeline = createStepScopePipeline({
      steps: [{ name: "analyze", skill: "analyze" }],
      inputs,
      contractInputs: { briefing: "Scope-safe briefing" }
    });
    const harness = createStepScopeHarness({
      pipeline,
      stepIndex: 0,
      inputs,
      policyEvidence: services.policyEvidence
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
          Effect.sync(() => `forbidden: ${(context.inputs as Record<string, unknown>).forbiddenInput}`)
      }
    });

    expect(result.success).toBe(false);

    const evidence = Effect.runSync(
      services.policyEvidence.listOperationalEvidence({ boundary: "scope", outcome: "block" })
    );
    expect(evidence.some((entry) =>
      entry.boundary === "scope" &&
      entry.outcome === "block" &&
      entry.rationaleCategory === "unauthorized_input_read" &&
      entry.summary?.includes("forbiddenInput")
    )).toBe(true);
  });

  it("emits scope evidence for invalid handoff artifacts", () => {
    const services = createStepScopeServices();
    const inputs = { briefing: "Scope-safe briefing" };
    const pipeline = createStepScopePipeline({
      steps: [{ name: "draft", skill: "draft" }],
      inputs
    });
    const harness = createStepScopeHarness({
      pipeline,
      stepIndex: 0,
      inputs,
      policyEvidence: services.policyEvidence
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

    const evidence = Effect.runSync(
      services.policyEvidence.listOperationalEvidence({ boundary: "scope", outcome: "block" })
    );
    expect(evidence.some((entry) =>
      entry.boundary === "scope" &&
      entry.outcome === "block" &&
      entry.rationaleCategory === "invalid_handoff_artifact" &&
      entry.summary?.includes("draft")
    )).toBe(true);
  });
});
