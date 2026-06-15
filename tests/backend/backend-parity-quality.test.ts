import { describe, expect, it } from "vitest";
import type { QualityMode } from "@my-ai-orchestrator/contracts";
import {
  buildQualityModeAttempts,
  createExecutionControls,
  createExecutionTelemetry,
  resolveSelection,
  scoreExecution
} from "../../apps/backend";
import { createSimplifiedRequest } from "./parity.shared.js";

describe("M2-26: Paridade Funcional - Quality Execution", () => {
  describe("resolveSelection", () => {
    it("usa qualidade do request quando fornecida", () => {
      const request = createSimplifiedRequest("twitter-thread", "Test");
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
      const request = createSimplifiedRequest("twitter-thread", "Test");

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
      const request = createSimplifiedRequest("twitter-thread", "Test");
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
      const request = createSimplifiedRequest("twitter-thread", "Test");

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

  describe("scoreExecution", () => {
    it("retorna score entre 0 e 100", () => {
      const short = scoreExecution("Hi", 1, "fast");
      const medium = scoreExecution("Medium length tweet content", 2, "balanced");
      const long = scoreExecution(
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

      const fastScore = scoreExecution(content, 3, "fast");
      const balancedScore = scoreExecution(content, 3, "balanced");
      const strictScore = scoreExecution(content, 3, "strict");

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
