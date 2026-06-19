import type { PlannedStep, PlanSignature } from "@my-ai-orchestrator/contracts";

export interface CompositorPreset {
  readonly id: PlanSignature;
  readonly steps: readonly PlannedStep[];
  readonly relativeCostWeight: number;
}

export const COMPOSITOR_PRESET_IDS = [
  "short-piece",
  "long-piece",
  "serial-piece",
  "edition-piece"
] as const satisfies readonly PlanSignature[];

export const COMPOSITOR_PRESETS: Record<PlanSignature, CompositorPreset> = {
  "short-piece": {
    id: "short-piece",
    relativeCostWeight: 1,
    steps: [
      { name: "hook", skill: "hook", execution: "llm", routingProfile: "linkedin-llm" },
      { name: "draft", skill: "draft", execution: "llm", routingProfile: "linkedin-llm" },
      { name: "refine", skill: "refine", execution: "llm", routingProfile: "linkedin-llm" },
      { name: "sanitize", skill: "sanitize", execution: "local" }
    ]
  },
  "long-piece": {
    id: "long-piece",
    relativeCostWeight: 3,
    steps: [
      { name: "research", skill: "research", execution: "local" },
      { name: "outline", skill: "outline", execution: "local" },
      { name: "draft", skill: "draft", execution: "llm", routingProfile: "premium-llm" },
      { name: "refine", skill: "refine", execution: "llm", routingProfile: "premium-llm" },
      { name: "finalize", skill: "publish", execution: "local" },
      { name: "sanitize", skill: "sanitize", execution: "local" }
    ]
  },
  "serial-piece": {
    id: "serial-piece",
    relativeCostWeight: 1.5,
    steps: [
      { name: "analyze", skill: "analyze", execution: "local" },
      { name: "draft", skill: "draft", execution: "llm", routingProfile: "default-llm" },
      { name: "tighten", skill: "tighten", execution: "llm", routingProfile: "default-llm" },
      { name: "sanitize", skill: "sanitize", execution: "local" }
    ]
  },
  "edition-piece": {
    id: "edition-piece",
    relativeCostWeight: 2,
    steps: [
      { name: "draft", skill: "draft", execution: "llm", routingProfile: "default-llm" },
      { name: "refine", skill: "refine", execution: "llm", routingProfile: "default-llm" },
      { name: "tighten", skill: "tighten", execution: "llm", routingProfile: "default-llm" },
      { name: "sanitize", skill: "sanitize", execution: "local" }
    ]
  }
};

export function getPreset(id: PlanSignature): CompositorPreset {
  return COMPOSITOR_PRESETS[id];
}

function stepExecutionWeight(step: PlannedStep): number {
  return step.execution === "llm" ? 1 : 0.1;
}

function presetContainsStep(presetId: PlanSignature, step: PlannedStep): boolean {
  return COMPOSITOR_PRESETS[presetId].steps.some(
    (presetStep) =>
      presetStep.name === step.name &&
      presetStep.skill === step.skill &&
      presetStep.routingProfile === step.routingProfile &&
      presetStep.execution === step.execution
  );
}

function presetContainsStepName(presetId: PlanSignature, stepName: string): boolean {
  return COMPOSITOR_PRESETS[presetId].steps.some((presetStep) => presetStep.name === stepName);
}

function pickStepOwner(
  step: PlannedStep,
  basePresetId: PlanSignature
): PlanSignature {
  const exactOwners = COMPOSITOR_PRESET_IDS.filter((presetId) => presetContainsStep(presetId, step));

  if (exactOwners.length === 1) {
    return exactOwners[0]!;
  }

  if (exactOwners.includes(basePresetId)) {
    return basePresetId;
  }

  if (exactOwners.length > 1) {
    return exactOwners.reduce((current, candidate) =>
      COMPOSITOR_PRESETS[candidate].steps.length < COMPOSITOR_PRESETS[current].steps.length
        ? candidate
        : current
    );
  }

  const nameOwners = COMPOSITOR_PRESET_IDS.filter((presetId) => presetContainsStepName(presetId, step.name));

  if (nameOwners.includes(basePresetId)) {
    return basePresetId;
  }

  if (nameOwners.length > 0) {
    return nameOwners.reduce((current, candidate) =>
      COMPOSITOR_PRESETS[candidate].steps.length < COMPOSITOR_PRESETS[current].steps.length
        ? candidate
        : current
    );
  }

  return basePresetId;
}

export function resolveDominantPlanSignature(
  steps: readonly PlannedStep[],
  basePresetId: PlanSignature
): PlanSignature {
  const scores = new Map<PlanSignature, number>(
    COMPOSITOR_PRESET_IDS.map((id) => [id, 0])
  );

  for (const step of steps) {
    const owner = pickStepOwner(step, basePresetId);
    const preset = COMPOSITOR_PRESETS[owner];
    const contribution =
      (preset.relativeCostWeight / preset.steps.length) * stepExecutionWeight(step);
    scores.set(owner, (scores.get(owner) ?? 0) + contribution);
  }

  let winner = basePresetId;
  let bestScore = scores.get(basePresetId) ?? 0;

  for (const presetId of COMPOSITOR_PRESET_IDS) {
    const score = scores.get(presetId) ?? 0;
    if (score > bestScore) {
      bestScore = score;
      winner = presetId;
    }
  }

  return winner;
}
