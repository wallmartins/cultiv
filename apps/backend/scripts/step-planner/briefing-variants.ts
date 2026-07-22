import { CALIBRATION_BRIEFINGS } from "../calibration/briefings.js";
import type { CompositorParityFixture } from "../compositor/parity-fixtures.js";

export type BriefingVariantKind = "minimal" | "typical" | "heavy";

export interface BriefingVariant {
  readonly kind: BriefingVariantKind;
  readonly briefing: Record<string, unknown>;
}

// Keyed by the fixture's calibration-briefing key (descriptive labels, not a contracts type — the
// GenerationIntent axis these once mapped to died in the Practice Profile Phase 1 clean cut).
// Unknown keys fall back to a minimal generic topic / the typical briefing plus padded notes.
const MINIMAL_BRIEFINGS: Readonly<Record<string, Record<string, unknown>>> = {
  "explain-deeply": { topic: "Brief overview" },
  "engage-audience": { topic: "Community update" },
  "document-decision": { decision: "Proceed", systemContext: "Short context" },
  "share-idea": { topic: "Quick idea" },
  "tell-story": { topic: "Short story", hook: "Once" },
  "update-subscribers": { topic: "Monthly update", audience: "subscribers" }
};

const HEAVY_EXTRAS: Readonly<Record<string, Record<string, unknown>>> = {
  "explain-deeply": { context: "x".repeat(200) },
  "document-decision": { systemContext: "x".repeat(401) }
};

function minimalBriefingFor(briefingKey: string): Record<string, unknown> {
  return MINIMAL_BRIEFINGS[briefingKey] ?? { topic: "Brief overview" };
}

function heavyBriefingFor(briefingKey: string): Record<string, unknown> {
  return {
    ...CALIBRATION_BRIEFINGS[briefingKey],
    ...(HEAVY_EXTRAS[briefingKey] ?? { notes: "x".repeat(200) })
  };
}

export function briefingVariantsForFixture(fixture: CompositorParityFixture): readonly BriefingVariant[] {
  return [
    { kind: "minimal", briefing: minimalBriefingFor(fixture.briefingKey) },
    { kind: "typical", briefing: { ...fixture.briefing } },
    { kind: "heavy", briefing: heavyBriefingFor(fixture.briefingKey) }
  ];
}
