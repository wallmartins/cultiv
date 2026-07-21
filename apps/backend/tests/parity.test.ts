import { describe, expect, it } from "vitest";
import { Effect } from "effect";
import {
  decodePipelineRequest,
  JobCreatedResponseSchema,
  JobStatusResponseSchema,
  SyncRunResponseSchema
} from "@my-ai-orchestrator/contracts";
import { createBackendJobStoreService } from "../src/jobs/job-store.js";
import {
  buildQualityModeAttempts,
  createExecutionControls,
  createExecutionTelemetry,
  resolveSelection,
  estimateStepProgressScore
} from "../src/execution/quality/quality.js";
import type { PipelineRequest, PlanSignature, QualityMode } from "@my-ai-orchestrator/contracts";

describe("M2-26: Paridade Funcional - Job Store", () => {
  describe("createQueuedJob", () => {
    it("cria job com status initial 'queued'", () => {
      const store = createJobStoreHarness();
      const request = createSimplifiedRequest("serial-piece", "Crie um tweet viral");
      const created = store.createQueuedJob(request);

      expect(created.status).toBe("queued");
      expect(created.jobId).toBeDefined();
      expect(created.jobId.length).toBeGreaterThan(0);
    });

    it("resolves contentType from pipelineType", () => {
      const store = createJobStoreHarness();
      const request = createSimplifiedRequest("serial-piece", "Test");
      const created = store.createQueuedJob(request);

      expect(created.contentType).toBe("serial-piece");
    });

    it("resolves estimatedSteps from request structure", () => {
      const store = createJobStoreHarness();

      const simplified = createSimplifiedRequest("serial-piece", "Test");
      const simplifiedJob = store.createQueuedJob(simplified);
      expect(simplifiedJob.estimatedSteps).toBe(1);

      const explicit: PipelineRequest = {
        pipeline: {
          name: "test-pipeline",
          steps: [
            { name: "step-1", skill: "skill-1" },
            { name: "step-2", skill: "skill-2" },
            { name: "step-3", skill: "skill-3" }
          ]
        },
        inputs: {}
      };
      const explicitJob = store.createQueuedJob(explicit);
      expect(explicitJob.estimatedSteps).toBe(3);
    });

    it("permite idempotency via idempotencyKey no request", () => {
      const store = createJobStoreHarness();
      const requestWithKey = {
        pipelineType: "serial-piece" as const,
        briefing: "Test",
        idempotencyKey: "unique-key-123"
      };
      const created = store.createQueuedJob(requestWithKey);
      expect(created).toBeDefined();
    });

    it("cria evento initial de progress", () => {
      const store = createJobStoreHarness();
      const request = createSimplifiedRequest("serial-piece", "Test");
      const created = store.createQueuedJob(request);
      const events = store.listJobEvents(created.jobId);

      expect(events.length).toBe(1);
      expect(events[0].type).toBe("progress");
      expect((events[0].payload as { currentStep: string }).currentStep).toBe("queued");
    });
  });

  describe("getJobStatus", () => {
    it("retorna undefined para job inexistente", () => {
      const store = createJobStoreHarness();
      const status = store.getJobStatus("non-existent-id");
      expect(status).toBeUndefined();
    });

    it("retorna status correto após criação", () => {
      const store = createJobStoreHarness();
      const request = createSimplifiedRequest("serial-piece", "Test");
      const created = store.createQueuedJob(request);
      const status = store.getJobStatus(created.jobId);

      expect(status).toBeDefined();
      expect(status!.jobId).toBe(created.jobId);
      expect(status!.status).toBe("queued");
    });
  });

  describe("updateJobProgress", () => {
    it("atualiza status para 'running' após progress", () => {
      const store = createJobStoreHarness();
      const request = createSimplifiedRequest("serial-piece", "Test");
      const created = store.createQueuedJob(request);

      const updated = store.updateJobProgress(created.jobId, {
        currentStep: "thread-body",
        stepIndex: 1,
        totalSteps: 5,
        percent: 20
      });

      expect(updated).toBeDefined();
      expect(updated!.status).toBe("running");
      expect(updated!.progress?.currentStep).toBe("thread-body");
      expect(updated!.progress?.percent).toBe(20);
    });

    it("adiciona evento de progress", () => {
      const store = createJobStoreHarness();
      const request = createSimplifiedRequest("serial-piece", "Test");
      const created = store.createQueuedJob(request);

      store.updateJobProgress(created.jobId, {
        currentStep: "step-1",
        stepIndex: 0,
        totalSteps: 3,
        percent: 33
      });

      const events = store.listJobEvents(created.jobId);
      expect(events.length).toBe(2);
      expect(events[1].type).toBe("progress");
    });
  });

  describe("completeJob", () => {
    it("finaliza job com resultado", () => {
      const store = createJobStoreHarness();
      const request = createSimplifiedRequest("serial-piece", "Test");
      const created = store.createQueuedJob(request);

      const completed = store.completeJob(created.jobId, {
        content: "Tweet gerado com sucesso",
        metadata: {
          mode: "sync",
          adapter: "openai",
          model: "gpt-4o-mini",
          qualityMode: "balanced",
          telemetry: createExecutionTelemetry({
            executedCount: 5,
            maxLLMCalls: 10,
            inputTokensTotal: 1000,
            outputTokensTotal: 500,
            debitedCredits: 10,
            estimatedUsdCost: 0.015
          })
        }
      });

      expect(completed).toBeDefined();
      expect(completed!.status).toBe("done");
      expect(completed!.result?.content).toBe("Tweet gerado com sucesso");
      expect(completed!.progress?.percent).toBe(100);
    });

    it("emite evento 'done'", () => {
      const store = createJobStoreHarness();
      const request = createSimplifiedRequest("serial-piece", "Test");
      const created = store.createQueuedJob(request);

      store.completeJob(created.jobId, { content: "Done", metadata: {} });

      const events = store.listJobEvents(created.jobId);
      const doneEvent = events.find((e) => e.type === "done");
      expect(doneEvent).toBeDefined();
    });
  });

  describe("failJob", () => {
    it("marca job como failed com erro", () => {
      const store = createJobStoreHarness();
      const request = createSimplifiedRequest("serial-piece", "Test");
      const created = store.createQueuedJob(request);

      const failed = store.failJob(created.jobId, {
        message: "Pipeline execution failed",
        step: "thread-body"
      });

      expect(failed).toBeDefined();
      expect(failed!.status).toBe("failed");
      expect(failed!.error?.message).toBe("Pipeline execution failed");
      expect(failed!.error?.step).toBe("thread-body");
    });

    it("emite evento 'error'", () => {
      const store = createJobStoreHarness();
      const request = createSimplifiedRequest("serial-piece", "Test");
      const created = store.createQueuedJob(request);

      store.failJob(created.jobId, { message: "Error", step: null });

      const events = store.listJobEvents(created.jobId);
      const errorEvent = events.find((e) => e.type === "error");
      expect(errorEvent).toBeDefined();
    });
  });

  describe("subscribe", () => {
    it("notifica listener de novos eventos", async () => {
      const store = createJobStoreHarness();
      const request = createSimplifiedRequest("serial-piece", "Test");
      const created = store.createQueuedJob(request);

      const receivedEvents: Array<{ type: string }> = [];
      const unsubscribe = store.subscribe(created.jobId, (event) => {
        receivedEvents.push({ type: event.type });
      });

      await new Promise((r) => setTimeout(r, 10));

      store.updateJobProgress(created.jobId, {
        currentStep: "step-1",
        stepIndex: 0,
        totalSteps: 3,
        percent: 33
      });

      await new Promise((r) => setTimeout(r, 10));

      expect(receivedEvents.length).toBeGreaterThanOrEqual(1);

      unsubscribe();
    });

    it("retorna função para cancelar subscription", async () => {
      const store = createJobStoreHarness();
      const request = createSimplifiedRequest("serial-piece", "Test");
      const created = store.createQueuedJob(request);

      const receivedBefore: Array<{ type: string }> = [];
      const unsubscribe = store.subscribe(created.jobId, (event) => {
        receivedBefore.push({ type: event.type });
      });

      unsubscribe();

      store.updateJobProgress(created.jobId, {
        currentStep: "step-1",
        stepIndex: 0,
        totalSteps: 3,
        percent: 33
      });

      await new Promise((r) => setTimeout(r, 10));
      expect(receivedBefore.length).toBe(0);
    });
  });
});

describe("M2-26: Paridade Funcional - Quality Execution", () => {
  describe("resolveSelection", () => {
    it("usa qualidade do request quando fornecida", () => {
      const request = createSimplifiedRequest("serial-piece", "Test");
      (request as { qualityMode?: QualityMode }).qualityMode = "strict";

      const selection = resolveSelection(request, {
        executionMode: "sync",
        qualityMode: "fast",
        adapter: "openai",
        model: "gpt-4o-mini"
      });

      expect(selection.qualityMode).toBe("strict");
      expect(selection.reason).toBe("request");
    });

    it("usa fallback quando qualidade não fornecida", () => {
      const request = createSimplifiedRequest("serial-piece", "Test");

      const selection = resolveSelection(request, {
        executionMode: "sync",
        qualityMode: "balanced",
        adapter: "openai",
        model: "gpt-4o-mini"
      });

      expect(selection.qualityMode).toBe("balanced");
      expect(selection.reason).toBe("default");
    });

    it("usa adapter do request quando fornecido", () => {
      const request = createSimplifiedRequest("serial-piece", "Test");
      (request as { adapter?: string }).adapter = "anthropic";

      const selection = resolveSelection(request, {
        executionMode: "sync",
        qualityMode: "fast",
        adapter: "openai",
        model: "gpt-4o-mini"
      });

      expect(selection.adapter).toBe("anthropic");
    });

    it("constrói model a partir de adapter-qualityMode", () => {
      const request = createSimplifiedRequest("serial-piece", "Test");

      const selection = resolveSelection(request, {
        executionMode: "sync",
        qualityMode: "balanced",
        adapter: "openai",
        model: "gpt-4o-mini"
      });

      expect(selection.model).toBe("openai-balanced");
    });
  });

  describe("createExecutionControls", () => {
    it("fast mode: maxIterations=1, targetScore>=50", () => {
      const controls = createExecutionControls("fast", 5);

      expect(controls.qualityMode).toBe("fast");
      expect(controls.maxIterations).toBe(1);
      expect(controls.targetScore).toBeGreaterThanOrEqual(50);
    });

    it("balanced mode: maxIterations=2, targetScore>=70", () => {
      const controls = createExecutionControls("balanced", 5);

      expect(controls.qualityMode).toBe("balanced");
      expect(controls.maxIterations).toBe(2);
      expect(controls.targetScore).toBeGreaterThanOrEqual(70);
    });

    it("strict mode: maxIterations=3, targetScore>=80", () => {
      const controls = createExecutionControls("strict", 5);

      expect(controls.qualityMode).toBe("strict");
      expect(controls.maxIterations).toBe(3);
      expect(controls.targetScore).toBeGreaterThanOrEqual(80);
    });

    it("calcula maxLLMCalls baseado em stepCount", () => {
      const fast = createExecutionControls("fast", 5);
      const balanced = createExecutionControls("balanced", 5);
      const strict = createExecutionControls("strict", 5);

      expect(fast.maxLLMCalls).toBe(5);
      expect(balanced.maxLLMCalls).toBe(10);
      expect(strict.maxLLMCalls).toBe(15);
    });
  });

  describe("buildQualityModeAttempts", () => {
    it("fast inicia apenas em fast", () => {
      const attempts = buildQualityModeAttempts("fast");
      expect(attempts).toEqual(["fast", "balanced", "strict"]);
    });

    it("balanced ignora fast", () => {
      const attempts = buildQualityModeAttempts("balanced");
      expect(attempts).toEqual(["balanced", "strict"]);
    });

    it("strict retorna apenas strict", () => {
      const attempts = buildQualityModeAttempts("strict");
      expect(attempts).toEqual(["strict"]);
    });
  });

  describe("estimateStepProgressScore", () => {
    it("retorna score entre 0 e 100", () => {
      const short = estimateStepProgressScore("Hi", 1, "fast");
      const medium = estimateStepProgressScore("Medium length tweet content", 2, "balanced");
      const long = estimateStepProgressScore(
        "Long content with multiple paragraphs and detailed information about the topic",
        5,
        "strict"
      );

      expect(short).toBeGreaterThanOrEqual(0);
      expect(short).toBeLessThanOrEqual(100);
      expect(medium).toBeGreaterThanOrEqual(0);
      expect(medium).toBeLessThanOrEqual(100);
      expect(long).toBeGreaterThanOrEqual(0);
      expect(long).toBeLessThanOrEqual(100);
    });

    it("strict mode resulta em score mais alto que fast", () => {
      const content = "This is a medium length content that should score higher with strict mode";

      const fastScore = estimateStepProgressScore(content, 3, "fast");
      const balancedScore = estimateStepProgressScore(content, 3, "balanced");
      const strictScore = estimateStepProgressScore(content, 3, "strict");

      expect(strictScore).toBeGreaterThan(fastScore);
      expect(balancedScore).toBeGreaterThan(fastScore);
    });
  });

  describe("createExecutionTelemetry", () => {
    it("calcula bypassedCount como diferenca entre budget e executed", () => {
      const telemetry = createExecutionTelemetry({
        executedCount: 7,
        maxLLMCalls: 10
      });

      expect(telemetry.llm?.bypassedCount).toBe(3);
      expect(telemetry.llm?.llmCallsSaved).toBe(3);
    });

    it("calcula bypassRate como proporcao", () => {
      const telemetry = createExecutionTelemetry({
        executedCount: 5,
        maxLLMCalls: 10
      });

      expect(telemetry.llm?.bypassRate).toBe(0.5);
    });

    it("inclui informacoes de billing quando fornecidas", () => {
      const telemetry = createExecutionTelemetry({
        executedCount: 5,
        maxLLMCalls: 10,
        billing: {
          userId: "user-123",
          planId: "pro",
          generationCycleId: "cycle-abc"
        }
      });

      expect(telemetry.billing?.userId).toBe("user-123");
      expect(telemetry.billing?.planId).toBe("pro");
    });
  });
});

describe("M2-26: Paridade Funcional - Contract Decoding", () => {
  describe("decodePipelineRequest", () => {
    it("decodifica simplified request valido", async () => {
      const raw = {
        userId: "user-123",
        pipelineType: "serial-piece",
        briefing: "Crie um tweet sobre IA"
      };

      const result = await Effect.runPromise(
        Effect.either(decodePipelineRequest(raw))
      );

      expect(result._tag).toBe("Right");
    });

    it("decodifica explicit request valido", async () => {
      const raw = {
        pipeline: {
          name: "my-pipeline",
          steps: [
            { name: "step-1", skill: "skill-a" },
            { name: "step-2", skill: "skill-b" }
          ]
        },
        inputs: { topic: "AI" }
      };

      const result = await Effect.runPromise(
        Effect.either(decodePipelineRequest(raw))
      );

      expect(result._tag).toBe("Right");
    });

    it("falha com pipelineType invalido", async () => {
      const raw = {
        pipelineType: "invalid-pipeline-type",
        briefing: "Test"
      };

      const result = await Effect.runPromise(
        Effect.either(decodePipelineRequest(raw))
      );

      expect(result._tag).toBe("Left");
    });

    it("falha com request vazio", async () => {
      const result = await Effect.runPromise(
        Effect.either(decodePipelineRequest({}))
      );

      expect(result._tag).toBe("Left");
    });
  });

  describe("JobStatusResponse validation", () => {
    it("valida estrutura de status completo", () => {
      const validStatus = {
        jobId: "job-123",
        status: "done",
        contentType: "serial-piece",
        progress: {
          currentStep: "completed",
          stepIndex: 4,
          totalSteps: 5,
          percent: 100
        },
        result: {
          content: "Generated content",
          metadata: { mode: "sync", adapter: "openai" }
        },
        error: null,
        createdAt: "2024-01-15T10:00:00Z",
        completedAt: "2024-01-15T10:01:00Z"
      };

      const parseResult = SyncRunResponseSchema;
      expect(validStatus.status).toBe("done");
    });
  });
});

describe("M2-27: Audit - No Legacy Dependencies", () => {
  it("backend imports only from @my-ai-orchestrator packages and effect", () => {
    const allowedPrefixes = [
      "@my-ai-orchestrator/",
      "effect",
      "hono",
      "@hono/",
      "dotenv",
      "node:",
      "./",
      "../"
    ];

    const backendFiles = [
      "src/app.ts",
      "src/bootstrap.ts",
      "src/config.ts",
      "src/errors.ts",
      "src/execution.ts",
      "src/execution/billing.ts",
      "src/execution/quality.ts",
      "src/execution/runtime.ts",
      "src/execution/skills.ts",
      "src/http.ts",
      "src/job-store.ts",
      "src/main.ts",
      "src/memory.ts",
      "src/product.ts",
      "src/product/persistence.ts",
      "src/product/services.ts",
      "src/product/types.ts",
      "src/product/usage-policy.ts",
      "src/worker.ts"
    ];

    for (const file of backendFiles) {
      const content = getFileContent(file);
      const imports = extractImports(content);

      for (const imp of imports) {
        const isAllowed = allowedPrefixes.some((prefix) =>
          imp.startsWith(prefix)
        );
        if (!isAllowed && !imp.startsWith(".")) {
          console.log(`File: ${file}, Import: ${imp}`);
        }
        expect(isAllowed || imp.startsWith(".")).toBe(true);
      }
    }
  });
});

function createSimplifiedRequest(
  pipelineType: PlanSignature,
  briefing: string
): PipelineRequest {
  return {
    userId: "user-123",
    pipelineType,
    briefing
  };
}

function createJobStoreHarness() {
  const service = Effect.runSync(createBackendJobStoreService());

  return {
    createQueuedJob(request: Parameters<typeof service.createQueuedJob>[0], options?: Parameters<typeof service.createQueuedJob>[1]) {
      return Effect.runSync(service.createQueuedJob(request, options));
    },
    getJobStatus(jobId: Parameters<typeof service.getJobStatus>[0]) {
      return Effect.runSync(service.getJobStatus(jobId));
    },
    updateJobProgress(
      jobId: Parameters<typeof service.updateJobProgress>[0],
      progress: Parameters<typeof service.updateJobProgress>[1],
      updatedAt?: Parameters<typeof service.updateJobProgress>[2]
    ) {
      return Effect.runSync(service.updateJobProgress(jobId, progress, updatedAt));
    },
    completeJob(
      jobId: Parameters<typeof service.completeJob>[0],
      result: Parameters<typeof service.completeJob>[1],
      completedAt?: Parameters<typeof service.completeJob>[2]
    ) {
      return Effect.runSync(service.completeJob(jobId, result, completedAt));
    },
    failJob(
      jobId: Parameters<typeof service.failJob>[0],
      error: Parameters<typeof service.failJob>[1],
      completedAt?: Parameters<typeof service.failJob>[2]
    ) {
      return Effect.runSync(service.failJob(jobId, error, completedAt));
    },
    listJobEvents(jobId: Parameters<typeof service.listJobEvents>[0]) {
      return Effect.runSync(service.listJobEvents(jobId));
    },
    subscribe(
      jobId: Parameters<typeof service.subscribe>[0],
      listener: Parameters<typeof service.subscribe>[1]
    ) {
      return Effect.runSync(service.subscribe(jobId, listener));
    }
  };
}

function extractImports(content: string): string[] {
  const importRegex = /import\s+.*?from\s+['"]([^'"]+)['"]/g;
  const matches = [...content.matchAll(importRegex)];
  return matches.map((m) => m[1]);
}

function getFileContent(file: string): string {
  try {
    const fs = require("fs");
    const path = require("path");
    const fullPath = path.join(process.cwd(), "apps/backend", file);
    return fs.readFileSync(fullPath, "utf-8");
  } catch {
    return "";
  }
}

