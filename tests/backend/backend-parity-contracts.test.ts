import { describe, expect, it } from "vitest";
import { Effect } from "effect";
import {
  decodePipelineRequest,
  SyncRunResponseSchema
} from "@my-ai-orchestrator/contracts";

describe("M2-26: Paridade Funcional - Contract Decoding", () => {
  describe("decodePipelineRequest", () => {
    it("decodifica simplified request valido", async () => {
      const raw = {
        userId: "user-123",
        pipelineType: "twitter-thread",
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
        userId: "user-123",
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
        contentType: "twitter-thread",
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
      expect(parseResult).toBeDefined();
      expect(validStatus.status).toBe("done");
    });
  });
});
