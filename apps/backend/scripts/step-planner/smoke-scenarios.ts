import type { PlanSignature } from "@my-ai-orchestrator/contracts";
import {
  COMPOSITOR_PARITY_QUALITY_MODE,
  findCompositorParityFixture,
  type CompositorParityFixture
} from "../compositor/parity-fixtures.js";

export interface StepPlannerSmokeScenario {
  readonly id: string;
  readonly label: string;
  readonly fixture: CompositorParityFixture;
  readonly briefing: Record<string, unknown>;
  readonly expectPatchCount: number;
  readonly expectOps: readonly string[];
  readonly expectFinalPlanSignature: PlanSignature;
  readonly httpTimeoutMs?: number;
}

function requireFixture(id: string): CompositorParityFixture {
  const fixture = findCompositorParityFixture(id);
  if (!fixture) {
    throw new Error(`Smoke scenario references unknown fixture "${id}"`);
  }
  return fixture;
}

/** Curated scenarios that exercise each v1 briefing rule (fast smoke, not full COGS matrix). */
export const STEP_PLANNER_SMOKE_SCENARIOS: readonly StepPlannerSmokeScenario[] = [
  {
    id: "engage-audience-no-question",
    label: "engage-audience / short / social — drop hook when briefing has no question",
    fixture: requireFixture("engage-audience-short-social"),
    briefing: { topic: "Community update" },
    expectPatchCount: 1,
    expectOps: ["removeStep:hook"],
    expectFinalPlanSignature: "short-piece"
  },
  {
    id: "explain-deeply-short-briefing",
    label: "explain-deeply / long / blog — skip research/outline on short briefing",
    fixture: requireFixture("explain-deeply-long-blog"),
    briefing: { topic: "Brief overview" },
    expectPatchCount: 2,
    expectOps: ["removeStep:research", "removeStep:outline"],
    expectFinalPlanSignature: "long-piece",
    httpTimeoutMs: 1_800_000
  },
  {
    id: "document-decision-heavy-context",
    label: "document-decision / medium — insert structure before draft on long systemContext",
    fixture: requireFixture("document-decision-medium-unspecified"),
    briefing: {
      decision: "Adopt immutable snapshots",
      systemContext: "x".repeat(401)
    },
    expectPatchCount: 1,
    expectOps: ["insertStep:structure:before:draft"],
    expectFinalPlanSignature: "edition-piece"
  },
  {
    id: "tell-story-stable",
    label: "tell-story / medium — no channel invention; planner stays idle",
    fixture: requireFixture("tell-story-medium-unspecified"),
    briefing: { ...requireFixture("tell-story-medium-unspecified").briefing },
    expectPatchCount: 0,
    expectOps: [],
    expectFinalPlanSignature: "serial-piece"
  },
  {
    id: "engage-audience-with-question",
    label: "engage-audience / short / social — keep hook when question is present",
    fixture: requireFixture("engage-audience-short-social"),
    briefing: {
      topic: "Monorepos atrasam times pequenos?",
      question: "Você já viu monorepo acelerar ou travar seu time?"
    },
    expectPatchCount: 0,
    expectOps: [],
    expectFinalPlanSignature: "short-piece"
  }
];

export function findStepPlannerSmokeScenario(id: string): StepPlannerSmokeScenario | undefined {
  return STEP_PLANNER_SMOKE_SCENARIOS.find((entry) => entry.id === id);
}

export function smokePreviewBody(scenario: StepPlannerSmokeScenario): Record<string, unknown> {
  return {
    intent: scenario.fixture.intent,
    scope: scenario.fixture.scope,
    qualityMode: COMPOSITOR_PARITY_QUALITY_MODE,
    language: "pt-BR",
    briefing: scenario.briefing
  };
}
