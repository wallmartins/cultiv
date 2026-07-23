import { Effect } from "effect";
import { describe, expect, it } from "vitest";
import { buildOrchestrationPlan, createJobCoordinator } from "@my-ai-orchestrator/orchestrator";
import {
  createLanguageAwareDeclarativeSkillExecutor,
  validateDeclarativeSkill
} from "@my-ai-orchestrator/skills";
import { decodePipelineRequest } from "@my-ai-orchestrator/contracts";

describe("orchestrator and skills integration", () => {
  it("decodes a shared request contract and builds a normalized orchestration plan", () => {
    const request = Effect.runSync(decodePipelineRequest({
      userId: "user_1",
      pipelineType: "serial-piece",
      briefing: "Write a validation post about modular monorepos",
      language: "pt-BR",
      qualityMode: "balanced",
      idempotencyKey: "idem-001"
    }));

    const plan = buildOrchestrationPlan(request);

    expect(plan.request.variant).toBe("simplified");
    expect(plan.request.pipelineName).toBe("serial-piece");
    expect(plan.request.language).toBe("pt-BR");
    expect(plan.request.input).toEqual({
      briefing: "Write a validation post about modular monorepos"
    });
    expect(plan.estimatedSteps).toBe(4);
    expect(plan.stepProgress.map((step) => step.skill)).toEqual(["analyze", "draft", "tighten", "sanitize"]);
  });

  it("executes a language-aware skill through the orchestration job lifecycle", async () => {
    const request = Effect.runSync(decodePipelineRequest({
      userId: "user_2",
      pipelineType: "serial-piece",
      briefing: "Compare Effect layers with traditional dependency injection",
      language: "en-US",
      qualityMode: "strict"
    }));

    const plan = buildOrchestrationPlan(request);
    const coordinator = createJobCoordinator();
    const job = coordinator.createJob(plan, {
      jobId: "job_001",
      createdAt: "2026-05-09T00:00:00.000Z"
    });
    const running = coordinator.startJob(job, "2026-05-09T00:00:30.000Z");

    const skillDefinition = {
      name: "analyze",
      description: "Analyze the briefing with language hints",
      promptTemplate: "Lang: {{languageCode}} | Tone: {{languageTone}} | Brief: {{briefing}} | Step: {{step}}",
      inputMapping: {
        briefing: "$inputs.briefing",
        step: "$state.step"
      }
    };

    const validation = validateDeclarativeSkill(skillDefinition);
    expect(validation.valid).toBe(true);

    const skill = Effect.runSync(createLanguageAwareDeclarativeSkillExecutor(skillDefinition, {
      explicit: "en-US",
      mode: "critic"
    }));

    const result = await Effect.runPromise(skill.execute({
      pipeline: plan.pipeline,
      stepIndex: 0,
      state: { step: plan.pipeline.steps[0]?.name ?? "analyze" },
      inputs: plan.request.input,
      config: { tone: "formal" }
    }));

    const progressed = coordinator.updateProgress(
      running,
      {
        currentStep: "analyze",
        stepIndex: 0,
        totalSteps: plan.estimatedSteps,
        percent: 33
      },
      "2026-05-09T00:01:00.000Z"
    );

    const completed = coordinator.completeJob(
      progressed,
      {
        content: String(result.output),
        metadata: {
          step: "analyze",
          language: "en-US"
        }
      },
      "2026-05-09T00:02:00.000Z"
    );

    expect(result.output).toContain("Lang: en-US");
    expect(result.output).toContain("Tone: professional");
    expect(result.output).toContain("Brief: Compare Effect layers with traditional dependency injection");
    expect(result.output).toContain("Step: analyze");
    expect(progressed.status).toBe("running");
    expect(progressed.progress.percent).toBe(33);
    expect(completed.status).toBe("done");
    expect(completed.progress.percent).toBe(100);
    expect(completed.result?.metadata).toEqual({
      step: "analyze",
      language: "en-US"
    });
  });
});
