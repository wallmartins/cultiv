import { describe, expect, it } from "vitest";
import {
  resolveSanitizedGenerationInput,
  toRuntimeInputRecord
} from "../../apps/backend/src/execution/pipeline/sanitized-generation-input.js";

describe("backend pipeline runtime state", () => {
  it("builds minimized runtime inputs for explicit pipeline requests", () => {
    const sanitizedInput = resolveSanitizedGenerationInput({
      pipeline: {
        name: "custom-flow",
        steps: [{ name: "draft", skill: "draft" }]
      },
      inputs: {
        topic: "Imported context path"
      },
      importedContext: "External plain-text notes for the explicit flow",
      context: {
        hidden: "should not reach runtime inputs"
      },
      qualityMode: "balanced"
    }, {
      pipelineType: "validation-post",
      pipeline: {
        name: "custom-flow",
        steps: [{ name: "draft", skill: "draft" }]
      },
      contentType: {
        id: "custom-flow",
        label: "Custom Flow",
        defaultLanguage: "pt-BR",
        steps: [],
        inputSchema: {}
      },
      executionPlan: {
        id: "custom-flow",
        pipeline: {
          name: "custom-flow",
          steps: [{ name: "draft", skill: "draft" }]
        },
        input: {},
        mode: "sync",
        qualityMode: "balanced"
      },
      estimatedSteps: 1,
      progress: {
        currentStep: "draft",
        stepIndex: 0,
        totalSteps: 1,
        percent: 0
      },
      stepProgress: [],
      qualityLanes: [],
      request: {
        variant: "explicit",
        pipelineType: "validation-post",
        pipelineName: "custom-flow",
        contentTypeId: "custom-flow",
        language: "pt-BR",
        qualityMode: "balanced",
        executionMode: "sync",
        idempotencyKey: null,
        input: {
          topic: "Imported context path",
          importedContext: "External plain-text notes for the explicit flow"
        },
        pipeline: {
          name: "custom-flow",
          steps: [{ name: "draft", skill: "draft" }]
        }
      }
    });
    const inputs = toRuntimeInputRecord(sanitizedInput);

    expect(inputs).toMatchObject({
      topic: "Imported context path",
      importedContext: "External plain-text notes for the explicit flow"
    });
    expect(inputs).not.toHaveProperty("context");
  });
});
