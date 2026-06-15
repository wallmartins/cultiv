import { describe, expect, it } from "vitest";
import { Effect } from "effect";
import {
  createContextManagerLayer,
  createTraceRecorderLayer,
  type Pipeline
} from "../../packages/core/src/index.js";
import {
  createSkillRegistry,
  createSkillRegistryLayer,
  type SkillExecutionContext
} from "../../packages/skills/src/index.js";
import { runOrchestrationLoop } from "../../packages/orchestrator/src/orchestration-loop.js";

describe("runtime base integration", () => {
  it("runs retry, trace, and progress through the new runtime without HTTP", async () => {
    const pipeline: Pipeline = {
      name: "validation-post",
      steps: [
        {
          name: "draft",
          skill: "draft",
          retry: { maxAttempts: 2 }
        },
        {
          name: "refine",
          skill: "refine"
        }
      ],
      inputs: {}
    };
    const progressEvents: Array<
      | { readonly type: "pipeline-start"; readonly totalSteps: number; readonly pipelineName: string }
      | { readonly type: "step-start"; readonly stepName: string; readonly status: string }
      | { readonly type: "step-error"; readonly stepName: string; readonly message: string }
      | { readonly type: "step-complete"; readonly stepName: string; readonly status: string }
      | { readonly type: "pipeline-complete"; readonly completedSteps: number; readonly status: string }
    > = [];

    const registry = createSkillRegistry();
    let draftAttempts = 0;

    Effect.runSync(
      registry.register({
        name: "draft",
        description: "Drafts content with one retry",
        execute: (_context: SkillExecutionContext) =>
          Effect.gen(function* () {
            draftAttempts += 1;
            if (draftAttempts === 1) {
              return yield* Effect.fail(new Error("temporary adapter failure"));
            }

            return {
              output: "First draft",
              metadata: {
                draftVersion: draftAttempts
              }
            };
          })
      })
    );

    Effect.runSync(
      registry.register({
        name: "refine",
        description: "Refines the previous draft",
        execute: (context: SkillExecutionContext) =>
          Effect.succeed({
            output: `${String(context.state.draft)} refined`,
            metadata: {
              refined: true
            }
          })
      })
    );

    const result = await Effect.runPromise(
      runOrchestrationLoop(pipeline, { topic: "Effect runtime" }, {
        continueOnError: false,
        progressHandlers: {
          onPipelineStart: (totalSteps, pipelineName) => {
            progressEvents.push({ type: "pipeline-start", totalSteps, pipelineName });
          },
          onStepStart: (progress) => {
            progressEvents.push({ type: "step-start", stepName: progress.stepName, status: progress.status });
          },
          onStepError: (progress) => {
            progressEvents.push({
              type: "step-error",
              stepName: progress.stepName,
              message: progress.error.message
            });
          },
          onStepComplete: (progress) => {
            progressEvents.push({
              type: "step-complete",
              stepName: progress.stepName,
              status: progress.status
            });
          },
          onPipelineComplete: (_totalSteps, completedSteps, _durationMs, status) => {
            progressEvents.push({ type: "pipeline-complete", completedSteps, status });
          }
        }
      }).pipe(
        Effect.provide(createContextManagerLayer({ pipeline, inputs: { topic: "Effect runtime" } })),
        Effect.provide(createTraceRecorderLayer(pipeline, { topic: "Effect runtime" }, "test-adapter")),
        Effect.provide(createSkillRegistryLayer(registry))
      )
    );

    expect(result.status).toBe("completed");
    expect(result.completedSteps).toBe(2);
    expect(result.output).toMatchObject({
      draft: "First draft",
      refine: "First draft refined",
      draftVersion: 2,
      refined: true
    });

    expect(result.trace.status).toBe("completed");
    expect(result.trace.events?.map((event) => event.type)).toEqual([
      "step-start",
      "step-retry",
      "step-start",
      "step-complete",
      "step-start",
      "step-complete"
    ]);
    expect(result.trace.steps).toHaveLength(3);
    expect(result.trace.steps[0]?.error).toMatchObject({
      message: 'Skill "draft" failed during execution',
      type: "StepExecutionError"
    });
    expect(result.trace.steps[0]?.error?.cause).toBeInstanceOf(Error);
    expect(result.trace.steps[1]?.output).toBe("First draft");
    expect(result.trace.steps[2]?.output).toBe("First draft refined");

    expect(progressEvents).toEqual([
      { type: "pipeline-start", totalSteps: 2, pipelineName: "validation-post" },
      { type: "step-start", stepName: "draft", status: "running" },
      { type: "step-error", stepName: "draft", message: 'Skill "draft" failed during execution' },
      { type: "step-complete", stepName: "draft", status: "done" },
      { type: "step-start", stepName: "refine", status: "running" },
      { type: "step-complete", stepName: "refine", status: "done" },
      { type: "pipeline-complete", completedSteps: 2, status: "completed" }
    ]);
  });
});
