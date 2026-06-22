import type {
  GenerationIntent,
  GenerationLengthTier,
  GenerationScope,
  PlanSignature,
  QualityMode
} from "@my-ai-orchestrator/contracts";
import { resolvePhase1LegacyContentTypeId } from "@my-ai-orchestrator/contracts";
import { CALIBRATION_BRIEFINGS } from "../calibration/briefings.js";

export const COMPOSITOR_PARITY_QUALITY_MODE = "balanced" as const satisfies QualityMode;

export interface CompositorParityFixture {
  readonly id: string;
  readonly label: string;
  readonly intent: GenerationIntent;
  readonly scope: GenerationScope;
  readonly qualityMode: QualityMode;
  readonly briefing: Record<string, unknown>;
  readonly expectedLegacyContentType: string;
  readonly expectedCompositorPlanSignature: PlanSignature;
  readonly expectedExpressionProfile: string;
}

function fixture(args: {
  readonly id: string;
  readonly intent: GenerationIntent;
  readonly scope: GenerationScope;
  readonly expectedCompositorPlanSignature: PlanSignature;
  readonly expectedExpressionProfile: string;
}): CompositorParityFixture {
  const lengthTier = args.scope.lengthTier;
  const channel = args.scope.channel ?? "unspecified";

  return {
    id: args.id,
    label: `${args.intent} / ${lengthTier} / ${channel}`,
    intent: args.intent,
    scope: args.scope,
    qualityMode: COMPOSITOR_PARITY_QUALITY_MODE,
    briefing: { ...CALIBRATION_BRIEFINGS[args.intent] },
    expectedLegacyContentType: resolvePhase1LegacyContentTypeId(args.intent, lengthTier),
    expectedCompositorPlanSignature: args.expectedCompositorPlanSignature,
    expectedExpressionProfile: args.expectedExpressionProfile
  };
}

/** Six parity fixtures from the compositor spec matrix (shared briefing copy per intent). */
export const COMPOSITOR_PARITY_FIXTURES: readonly CompositorParityFixture[] = [
  fixture({
    id: "share-idea-short-professional-network",
    intent: "share-idea",
    scope: { lengthTier: "short", channel: "professional-network" },
    expectedCompositorPlanSignature: "short-piece",
    expectedExpressionProfile: "professional-share-idea"
  }),
  fixture({
    id: "share-idea-medium-email",
    intent: "share-idea",
    scope: { lengthTier: "medium", channel: "email" },
    expectedCompositorPlanSignature: "edition-piece",
    expectedExpressionProfile: "email-share-idea"
  }),
  fixture({
    id: "explain-deeply-long-blog",
    intent: "explain-deeply",
    scope: { lengthTier: "long", channel: "blog" },
    expectedCompositorPlanSignature: "long-piece",
    expectedExpressionProfile: "blog-explain-deeply"
  }),
  fixture({
    id: "document-decision-medium-unspecified",
    intent: "document-decision",
    scope: { lengthTier: "medium" },
    expectedCompositorPlanSignature: "edition-piece",
    expectedExpressionProfile: "document-decision-default"
  }),
  fixture({
    id: "engage-audience-short-social",
    intent: "engage-audience",
    scope: { lengthTier: "short", channel: "social" },
    expectedCompositorPlanSignature: "short-piece",
    expectedExpressionProfile: "social-engage-audience"
  }),
  fixture({
    id: "tell-story-medium-unspecified",
    intent: "tell-story",
    scope: { lengthTier: "medium" },
    expectedCompositorPlanSignature: "serial-piece",
    expectedExpressionProfile: "tell-story-default"
  })
];

export function findCompositorParityFixture(id: string): CompositorParityFixture | undefined {
  return COMPOSITOR_PARITY_FIXTURES.find((entry) => entry.id === id);
}

export function legacyContentTypeForFixture(input: {
  readonly intent: GenerationIntent;
  readonly lengthTier: GenerationLengthTier;
}): string {
  return resolvePhase1LegacyContentTypeId(input.intent, input.lengthTier);
}
