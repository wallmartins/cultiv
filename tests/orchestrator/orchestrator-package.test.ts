import { describe, expect, it } from "vitest";
import { Effect } from "effect";
import {
  OrchestrationCatalogService,
  OrchestrationJobCoordinatorService,
  OrchestrationPlannerService,
  OrchestrationPolicyServiceTag,
  OrchestrationStrategyService,
  buildOrchestrationPlan,
  calculateProgressPercent,
  createRuntimeBackedOrchestratorService,
  createOrchestratorLayer,
  createJobCoordinator,
  createOrchestrationPlanner,
  selectExecutionStrategy,
  shouldContinuePipeline,
  shouldRetryStep
} from "../../packages/orchestrator/src/index.js";

describe("orchestrator package", () => {
  it("builds a normalized plan for simplified requests", () => {
    const plan = buildOrchestrationPlan({
      userId: "user_1",
      pipelineType: "serial-piece",
      briefing: "Write a validation post"
    });

    expect(plan.pipeline.name).toBe("serial-piece");
    expect(plan.contentType.label).toBe("Serial Piece");
    expect(plan.estimatedSteps).toBe(4);
    expect(plan.progress.currentStep).toBe("analyze");
    expect(plan.stepProgress[0]?.status).toBe("running");
  });

  it("supports explicit pipelines and progress helpers", () => {
    const planner = createOrchestrationPlanner();
    const plan = planner.buildPlan({
      pipeline: {
        name: "custom-flow",
        steps: [
          { name: "step-a", skill: "analyze" },
          { name: "step-b", skill: "draft" }
        ]
      },
      inputs: { topic: "Monorepo" },
      importedContext: "External plain-text notes"
    });

    expect(plan.pipeline.steps).toHaveLength(2);
    expect(plan.contentType.id).toBe("custom-flow");
    expect(plan.request.input).toMatchObject({
      topic: "Monorepo",
      importedContext: "External plain-text notes"
    });
    expect(calculateProgressPercent(1, 2)).toBe(50);
  });

  it("exposes policy helpers through Effect layers", () => {
    const program = Effect.gen(function* () {
      const catalog = yield* OrchestrationCatalogService;
      const planner = yield* OrchestrationPlannerService;
      const policy = yield* OrchestrationPolicyServiceTag;
      const strategy = yield* OrchestrationStrategyService;
      const coordinator = yield* OrchestrationJobCoordinatorService;

      const plan = planner.buildPlan({
        userId: "user_3",
        pipelineType: "edition-piece",
        briefing: "Monthly newsletter"
      });

      return {
        defaultLanguage: catalog.defaultLanguageByPipeline["edition-piece"],
        stepCount: planner.estimateStepCount(catalog.pipelines["edition-piece"]),
        retry: policy.shouldRetry(1, { status: "failed" }),
        shouldContinue: policy.shouldContinue({ status: "done" }),
        strategy: strategy.selectStrategy(plan),
        job: coordinator.completeJob(
          coordinator.startJob(coordinator.createJob(plan, { jobId: "job_1" })),
          { content: "done", metadata: {} }
        )
      };
    });

    const result = Effect.runSync(program.pipe(Effect.provide(createOrchestratorLayer())));

    expect(result.defaultLanguage).toBe("pt-BR");
    expect(result.stepCount).toBe(4);
    expect(result.retry).toBe(true);
    expect(result.shouldContinue).toBe(true);
    expect(result.strategy.mode).toBe("sync");
    expect(result.job.status).toBe("done");
    expect(result.job.progress.percent).toBe(100);
  });

  it("keeps retry and continuation policies deterministic", () => {
    expect(shouldContinuePipeline({ status: "failed", continueOnError: true })).toBe(true);
    expect(shouldContinuePipeline({ status: "failed" })).toBe(true);
    expect(shouldRetryStep(1, { status: "failed" })).toBe(true);
    expect(shouldRetryStep(2, { status: "failed" })).toBe(false);
  });

  it("selects execution strategies and job coordination helpers deterministically", () => {
    const plan = buildOrchestrationPlan({
      pipeline: {
        name: "async-custom",
        steps: [{ name: "step-1", skill: "analyze" }]
      },
      inputs: { topic: "monorepo" },
      qualityMode: "balanced"
    }, {
      executionMode: "async"
    });
    const coordinator = createJobCoordinator();
    const job = coordinator.createJob(plan, { jobId: "job_async", createdAt: "2026-05-09T00:00:00.000Z" });
    const running = coordinator.startJob(job, "2026-05-09T00:01:00.000Z");
    const progressed = coordinator.updateProgress(
      running,
      {
        currentStep: "step-1",
        stepIndex: 0,
        totalSteps: 1,
        percent: 50
      },
      "2026-05-09T00:02:00.000Z"
    );
    const failed = coordinator.failJob(
      progressed,
      { message: "boom", step: null },
      "2026-05-09T00:03:00.000Z"
    );

    expect(selectExecutionStrategy(plan).mode).toBe("async");
    expect(job.strategy.name).toBe("AsyncStrategy");
    expect(running.status).toBe("running");
    expect(progressed.progress.percent).toBe(50);
    expect(failed.status).toBe("failed");
    expect(failed.error?.message).toBe("boom");
  });

  it("exposes a runtime-backed orchestrator service adapter", () => {
    const service = createRuntimeBackedOrchestratorService();

    expect(typeof service.run).toBe("function");
    expect(typeof service.runPipeline).toBe("function");
  });
});
