import type { GenerationIntent } from "@my-ai-orchestrator/contracts";
import { CALIBRATION_BRIEFINGS } from "../calibration/briefings.js";
import type { CompositorParityFixture } from "../compositor/parity-fixtures.js";

export type BriefingVariantKind = "minimal" | "typical" | "heavy";

export interface BriefingVariant {
  readonly kind: BriefingVariantKind;
  readonly briefing: Record<string, unknown>;
}

function minimalBriefingForIntent(intent: GenerationIntent): Record<string, unknown> {
  switch (intent) {
    case "explain-deeply":
      return { topic: "Brief overview" };
    case "engage-audience":
      return { topic: "Community update" };
    case "document-decision":
      return { decision: "Proceed", systemContext: "Short context" };
    case "share-idea":
      return { topic: "Quick idea" };
    case "tell-story":
      return { topic: "Short story", hook: "Once" };
    case "update-subscribers":
      return { topic: "Monthly update", audience: "subscribers" };
    default: {
      const _exhaustive: never = intent;
      return _exhaustive;
    }
  }
}

function heavyBriefingForIntent(intent: GenerationIntent): Record<string, unknown> {
  switch (intent) {
    case "explain-deeply":
      return {
        ...CALIBRATION_BRIEFINGS["explain-deeply"],
        context: "x".repeat(200)
      };
    case "engage-audience":
      return CALIBRATION_BRIEFINGS["engage-audience"];
    case "document-decision":
      return {
        ...CALIBRATION_BRIEFINGS["document-decision"],
        systemContext: "x".repeat(401)
      };
    case "share-idea":
    case "tell-story":
    case "update-subscribers":
      return {
        ...CALIBRATION_BRIEFINGS[intent],
        notes: "x".repeat(200)
      };
    default: {
      const _exhaustive: never = intent;
      return _exhaustive;
    }
  }
}

export function briefingVariantsForFixture(fixture: CompositorParityFixture): readonly BriefingVariant[] {
  return [
    { kind: "minimal", briefing: minimalBriefingForIntent(fixture.intent) },
    { kind: "typical", briefing: { ...fixture.briefing } },
    { kind: "heavy", briefing: heavyBriefingForIntent(fixture.intent) }
  ];
}
