import { describe, expect, it } from "vitest";
import type { QualityMode } from "@my-ai-orchestrator/contracts";
import { createExecutionControls } from "../../apps/backend/src/execution/quality/quality-controls.js";
import { buildQualityAttempts } from "../../apps/backend/src/execution/quality/quality-selection.js";
import { laneCountForQualityMode } from "../../apps/backend/src/execution/quality/quality-lanes.js";

// Reproduz o guard de runtime-attempt-loop.ts: cada attempt só roda se couber no budget
// restante, e consome stepCount * laneCount (attemptsUsed conta todo passo do pipeline,
// por lane). Se essa aritmética mudar, o custo real por modo muda junto — e o preço em
// créditos (1 / 2.5 / 10) deixa de acompanhar o custo.
function simulateLadder(mode: QualityMode, stepCount: number) {
  const controls = createExecutionControls(mode, stepCount);
  const ladder = buildQualityAttempts(mode, controls.maxIterations ?? 1);
  const executedModes: QualityMode[] = [];
  let executedSteps = 0;

  for (const attemptMode of ladder) {
    const attemptBudget = stepCount * laneCountForQualityMode(attemptMode);
    if (executedSteps + attemptBudget > (controls.maxLLMCalls ?? Number.POSITIVE_INFINITY)) {
      break;
    }
    executedSteps += attemptBudget;
    executedModes.push(attemptMode);
  }

  return { ladder, executedModes, executedSteps };
}

describe("economia da escada de qualidade", () => {
  const STEP_COUNT = 4;

  it("mantém o custo monotônico com o preço cobrado (fast < balanced < strict)", () => {
    const fast = simulateLadder("fast", STEP_COUNT).executedSteps;
    const balanced = simulateLadder("balanced", STEP_COUNT).executedSteps;
    const strict = simulateLadder("strict", STEP_COUNT).executedSteps;

    expect(fast).toBeLessThan(balanced);
    expect(balanced).toBeLessThan(strict);
  });

  // A escada declara balanced -> strict, mas o budget de balanced (stepCount * 2) é
  // consumido inteiro pelo primeiro attempt. A escalação é inalcançável por construção;
  // se alguém afrouxar maxLLMCalls sem revisar o preço, balanced passa a custar mais que
  // strict (2 + 3 lanes contra 3) e este teste quebra.
  it("não deixa balanced escalar para strict dentro do próprio budget", () => {
    const { ladder, executedModes } = simulateLadder("balanced", STEP_COUNT);

    expect(ladder).toEqual(["balanced", "strict"]);
    expect(executedModes).toEqual(["balanced"]);
  });

  it("consome exatamente o budget declarado em cada modo", () => {
    for (const mode of ["fast", "balanced", "strict"] as const) {
      const controls = createExecutionControls(mode, STEP_COUNT);
      expect(simulateLadder(mode, STEP_COUNT).executedSteps).toBe(controls.maxLLMCalls);
    }
  });
});
