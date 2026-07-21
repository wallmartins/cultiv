import { describe, expect, it } from "vitest";
import { evaluateVoiceSignatureDivergence } from "../../apps/backend/src/product/voice/voice-signature-divergence.js";
import { TEST_REASONING_EXTRACTION_FIXTURE } from "../../apps/backend/src/product/voice/reasoning-extraction.js";
import { TEST_ARGUMENT_DEVELOPMENT_EXTRACTION_FIXTURE } from "../../apps/backend/src/product/voice/argument-development-extraction.js";

describe("voice signature divergence", () => {
  it("detects exploratory posture conflicting with high certainty", () => {
    const result = evaluateVoiceSignatureDivergence({
      reasoning: {
        ...TEST_REASONING_EXTRACTION_FIXTURE,
        core: {
          ...TEST_REASONING_EXTRACTION_FIXTURE.core,
          certaintyLevel: "high",
          conclusionPace: "fast"
        }
      },
      development: TEST_ARGUMENT_DEVELOPMENT_EXTRACTION_FIXTURE.development
    });

    expect(result.hasConflict).toBe(true);
    expect(result.reasons).toContain("exploratory_posture_conflicts_with_core_certainty_or_pace");
  });

  it("detects advocacy conflicting with observational core", () => {
    const result = evaluateVoiceSignatureDivergence({
      reasoning: {
        ...TEST_REASONING_EXTRACTION_FIXTURE,
        core: {
          ...TEST_REASONING_EXTRACTION_FIXTURE.core,
          judgmentFrequency: "low",
          conclusionPace: "slow",
          readerRelationship: "observer"
        }
      },
      development: {
        ...TEST_ARGUMENT_DEVELOPMENT_EXTRACTION_FIXTURE.development,
        epistemicPosture: "advocacy"
      }
    });

    expect(result.hasConflict).toBe(true);
    expect(result.reasons).toContain("advocacy_conflicts_with_observational_core");
  });

  it("detects investigative moves conflicting with high judgment", () => {
    const result = evaluateVoiceSignatureDivergence({
      reasoning: {
        ...TEST_REASONING_EXTRACTION_FIXTURE,
        core: {
          ...TEST_REASONING_EXTRACTION_FIXTURE.core,
          judgmentFrequency: "high"
        }
      },
      development: {
        ...TEST_ARGUMENT_DEVELOPMENT_EXTRACTION_FIXTURE.development,
        epistemicPosture: "investigative",
        moveLabels: ["doubt", "experimentation", "conclusion"]
      }
    });

    expect(result.hasConflict).toBe(true);
    expect(result.reasons).toContain("investigative_moves_conflict_with_high_judgment");
  });

  it("skips reconciliation when drafts align", () => {
    const result = evaluateVoiceSignatureDivergence({
      reasoning: TEST_REASONING_EXTRACTION_FIXTURE,
      development: {
        ...TEST_ARGUMENT_DEVELOPMENT_EXTRACTION_FIXTURE.development,
        developmentProse:
          "A distinct developmental path: scene, tension, experiment, and a late conclusion without repeating cognitive traits.",
        epistemicPosture: "investigative",
        structuralAntiPatterns: ["abrupt_pivot"]
      }
    });

    expect(result.hasConflict).toBe(false);
  });
});
