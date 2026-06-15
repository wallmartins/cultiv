import { describe, expect, it } from "vitest";
import type { PipelineRequest } from "@my-ai-orchestrator/contracts";
import { createExecutionTelemetry } from "../../apps/backend";
import { createJobStoreHarness, createSimplifiedRequest } from "./parity.shared.js";

describe("M2-26: Paridade Funcional - Job Store", () => {
  describe("createQueuedJob", () => {
    it("cria job com status initial 'queued'", () => {
      const store = createJobStoreHarness();
      const request = createSimplifiedRequest("twitter-thread", "Crie um tweet viral");
      const created = store.createQueuedJob(request);

      expect(created.status).toBe("queued");
      expect(created.jobId).toBeDefined();
      expect(created.jobId.length).toBeGreaterThan(0);
    });

    it("resolves contentType from pipelineType", () => {
      const store = createJobStoreHarness();
      const request = createSimplifiedRequest("twitter-thread", "Test");
      const created = store.createQueuedJob(request);

      expect(created.contentType).toBe("twitter-thread");
    });

    it("resolves estimatedSteps from request structure", () => {
      const store = createJobStoreHarness();

      const simplified = createSimplifiedRequest("twitter-thread", "Test");
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
        pipelineType: "twitter-thread" as const,
        briefing: "Test",
        idempotencyKey: "unique-key-123"
      };
      const created = store.createQueuedJob(requestWithKey);
      expect(created).toBeDefined();
    });

    it("cria evento initial de progress", () => {
      const store = createJobStoreHarness();
      const request = createSimplifiedRequest("twitter-thread", "Test");
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
      const request = createSimplifiedRequest("twitter-thread", "Test");
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
      const request = createSimplifiedRequest("twitter-thread", "Test");
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
      const request = createSimplifiedRequest("twitter-thread", "Test");
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
      const request = createSimplifiedRequest("twitter-thread", "Test");
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
      const request = createSimplifiedRequest("twitter-thread", "Test");
      const created = store.createQueuedJob(request);

      store.completeJob(created.jobId, { content: "Done", metadata: {} });

      const events = store.listJobEvents(created.jobId);
      const doneEvent = events.find((event) => event.type === "done");
      expect(doneEvent).toBeDefined();
    });
  });

  describe("failJob", () => {
    it("marca job como failed com erro", () => {
      const store = createJobStoreHarness();
      const request = createSimplifiedRequest("twitter-thread", "Test");
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
      const request = createSimplifiedRequest("twitter-thread", "Test");
      const created = store.createQueuedJob(request);

      store.failJob(created.jobId, { message: "Error", step: null });

      const events = store.listJobEvents(created.jobId);
      const errorEvent = events.find((event) => event.type === "error");
      expect(errorEvent).toBeDefined();
    });
  });

  describe("subscribe", () => {
    it("notifica listener de novos eventos", () => {
      const store = createJobStoreHarness();
      const request = createSimplifiedRequest("twitter-thread", "Test");
      const created = store.createQueuedJob(request);

      const receivedEvents: Array<{ type: string }> = [];
      const unsubscribe = store.subscribe(created.jobId, (event) => {
        receivedEvents.push({ type: event.type });
      });

      store.updateJobProgress(created.jobId, {
        currentStep: "step-1",
        stepIndex: 0,
        totalSteps: 3,
        percent: 33
      });

      expect(receivedEvents.length).toBeGreaterThanOrEqual(1);

      unsubscribe();
    });

    it("retorna função para cancelar subscription", () => {
      const store = createJobStoreHarness();
      const request = createSimplifiedRequest("twitter-thread", "Test");
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
      expect(receivedBefore.length).toBe(0);
    });
  });
});
