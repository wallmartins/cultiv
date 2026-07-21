import type {
  GenerationScope,
  PlanSignature,
  QualityMode,
  RhetoricalMode
} from "@my-ai-orchestrator/contracts";
import { CALIBRATION_BRIEFINGS } from "../calibration/briefings.js";

export const COMPOSITOR_PARITY_QUALITY_MODE = "balanced" as const satisfies QualityMode;

export interface CompositorParityFixture {
  readonly id: string;
  readonly label: string;
  readonly rhetoricalMode: RhetoricalMode;
  readonly scope: GenerationScope;
  readonly qualityMode: QualityMode;
  readonly briefing: Record<string, unknown>;
  readonly expectedCompositorPlanSignature: PlanSignature;
  readonly expectedExpressionProfile: string;
}

function fixture(args: {
  readonly id: string;
  readonly rhetoricalMode: RhetoricalMode;
  readonly briefingKey: string;
  readonly scope: GenerationScope;
  readonly expectedCompositorPlanSignature: PlanSignature;
  readonly expectedExpressionProfile: string;
}): CompositorParityFixture {
  const lengthTier = args.scope.lengthTier;
  const channel = args.scope.channel ?? "unspecified";

  return {
    id: args.id,
    label: `${args.rhetoricalMode} / ${lengthTier} / ${channel}`,
    rhetoricalMode: args.rhetoricalMode,
    scope: args.scope,
    qualityMode: COMPOSITOR_PARITY_QUALITY_MODE,
    briefing: { ...CALIBRATION_BRIEFINGS[args.briefingKey] },
    expectedCompositorPlanSignature: args.expectedCompositorPlanSignature,
    expectedExpressionProfile: args.expectedExpressionProfile
  };
}

/** Six parity fixtures from the compositor spec matrix (shared briefing copy per scenario). */
export const COMPOSITOR_PARITY_FIXTURES: readonly CompositorParityFixture[] = [
  fixture({
    id: "share-idea-short-professional-network",
    rhetoricalMode: "expound",
    briefingKey: "share-idea",
    scope: { lengthTier: "short", channel: "professional-network" },
    expectedCompositorPlanSignature: "short-piece",
    expectedExpressionProfile: "professional-expound"
  }),
  fixture({
    id: "share-idea-medium-email",
    rhetoricalMode: "expound",
    briefingKey: "share-idea",
    scope: { lengthTier: "medium", channel: "email" },
    expectedCompositorPlanSignature: "edition-piece",
    expectedExpressionProfile: "email-expound"
  }),
  fixture({
    id: "explain-deeply-long-blog",
    rhetoricalMode: "expound",
    briefingKey: "explain-deeply",
    scope: { lengthTier: "long", channel: "blog" },
    expectedCompositorPlanSignature: "long-piece",
    expectedExpressionProfile: "blog-expound"
  }),
  fixture({
    id: "document-decision-medium-unspecified",
    rhetoricalMode: "argue",
    briefingKey: "document-decision",
    scope: { lengthTier: "medium" },
    expectedCompositorPlanSignature: "edition-piece",
    expectedExpressionProfile: "argue-default"
  }),
  fixture({
    // promote (not argue): this fixture drives the step-planner smoke scenarios that exercise
    // the "drop hook when the briefing has no question" rule, which `derivePatchOps` only wires
    // for `promote` — see briefing-rules.ts.
    id: "engage-audience-short-social",
    rhetoricalMode: "promote",
    briefingKey: "engage-audience",
    scope: { lengthTier: "short", channel: "social" },
    expectedCompositorPlanSignature: "short-piece",
    expectedExpressionProfile: "social-promote"
  }),
  fixture({
    id: "tell-story-medium-unspecified",
    rhetoricalMode: "narrate",
    briefingKey: "tell-story",
    scope: { lengthTier: "medium" },
    expectedCompositorPlanSignature: "serial-piece",
    expectedExpressionProfile: "narrate-default"
  })
];

export function findCompositorParityFixture(id: string): CompositorParityFixture | undefined {
  return COMPOSITOR_PARITY_FIXTURES.find((entry) => entry.id === id);
}
