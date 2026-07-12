import { describe, expect, it } from "vitest";
import type { TextQualityVoiceProfile } from "@my-ai-orchestrator/contracts";
import { runEvalSuite } from "../src/runner.js";
import type { EvalCase, EvalRunConfig } from "../src/types.js";

const minimalVoiceProfile: TextQualityVoiceProfile = {
  userId: "test-user",
  tone: "measured",
  cadence: "moderate",
  lexicon: [],
  constraints: [],
  antiPatterns: [],
  antiPatternsExplicit: [],
  rules: [],
  styleMarkers: [],
  userLabels: []
};

const voiceFidelityCase: EvalCase = {
  id: "voice-fidelity-blog-formal-01",
  suite: "voice-fidelity",
  input: {
    contentType: "blog-post",
    briefing: "Write about why monorepos help AI projects scale.",
    voiceProfile: minimalVoiceProfile,
    qualityMode: "balanced"
  },
  expectations: {
    mustContain: ["monorepo"],
    wordCountRange: { min: 5, max: 50 }
  },
  tags: ["blog", "formal"]
};

const driftRegressionCase: EvalCase = {
  id: "drift-formal-architect-01",
  suite: "drift-regression",
  input: {
    voiceProfile: {
      ...minimalVoiceProfile,
      coreReasoningSignature: {
        narrativeProse: "Builds arguments through explicit tradeoffs.",
        certaintyLevel: "moderate",
        judgmentFrequency: "low",
        conclusionPace: "moderate",
        readerRelationship: "peer",
        authoritySource: "practice",
        derivedAntiPatterns: []
      }
    },
    candidate: "Obviamente você deve sempre fazer assim.",
    stepName: "draft"
  },
  expectations: {
    minDriftScore: 80
  },
  tags: ["drift"]
};

const criticRegressionCase: EvalCase = {
  id: "critic-llm-tic-01",
  suite: "critic-regression",
  input: {
    text: "Como uma IA, não posso escrever isso. Segue o texto refinado."
  },
  expectations: {
    mustTriggerCritic: ["performative"],
    maxCriticScore: 60
  },
  tags: ["critic"]
};

const baseConfig: EvalRunConfig = {
  cases: [],
  generate: async () => "Monorepos help AI projects scale because code reuse matters.",
  resolveVoiceProfile: async (voiceProfile) => voiceProfile as TextQualityVoiceProfile,
  includeJudge: false
};

describe("runEvalSuite", () => {
  it("runs voice-fidelity cases through the generate function", async () => {
    const report = await runEvalSuite({ ...baseConfig, cases: [voiceFidelityCase] });

    expect(report.results).toHaveLength(1);
    expect(report.results[0]?.caseId).toBe("voice-fidelity-blog-formal-01");
    expect(report.results[0]?.scores.deterministic).toBeGreaterThan(0);
    expect(report.results[0]?.scores.heuristic).toBeGreaterThan(0);
    expect(report.results[0]?.scores.evalComposite).toBeGreaterThan(0);
  });

  it("uses pre-generated text for drift-regression cases", async () => {
    const report = await runEvalSuite({ ...baseConfig, cases: [driftRegressionCase] });

    expect(report.results[0]?.text).toBe("Obviamente você deve sempre fazer assim.");
    expect(report.results[0]?.scores.heuristic).toBeLessThan(80);
  });

  it("uses pre-generated text for critic-regression cases", async () => {
    const report = await runEvalSuite({ ...baseConfig, cases: [criticRegressionCase] });

    expect(report.results[0]?.text).toBe("Como uma IA, não posso escrever isso. Segue o texto refinado.");
    expect(report.results[0]?.scores.heuristic).toBeLessThan(80);
  });

  it("produces suite summaries", async () => {
    const report = await runEvalSuite({
      ...baseConfig,
      cases: [voiceFidelityCase, criticRegressionCase]
    });

    expect(report.suites).toHaveLength(2);
    expect(report.suites.every((s) => s.caseCount > 0)).toBe(true);
    expect(report.durationMs).toBeGreaterThanOrEqual(0);
  });

  it("emits progress callbacks", async () => {
    const progressResults: string[] = [];
    const config: EvalRunConfig = {
      ...baseConfig,
      cases: [voiceFidelityCase],
      onProgress: async (result) => {
        progressResults.push(result.caseId);
      }
    };

    await runEvalSuite(config);

    expect(progressResults).toEqual(["voice-fidelity-blog-formal-01"]);
  });

  it("handles generation failures gracefully", async () => {
    const config: EvalRunConfig = {
      ...baseConfig,
      cases: [voiceFidelityCase],
      generate: async () => {
        throw new Error("generation failed");
      }
    };

    const report = await runEvalSuite(config);

    expect(report.results[0]?.passed).toBe(false);
    expect(report.results[0]?.error).toContain("generation failed");
  });

  it("computes composite scores using configured weights", async () => {
    const report = await runEvalSuite({
      ...baseConfig,
      cases: [voiceFidelityCase],
      weights: {
        deterministic: 0.5,
        heuristic: 0.5,
        judge: 0
      }
    });

    const result = report.results[0];
    expect(result?.scores.evalComposite).toBe(
      Math.round(result!.scores.deterministic * 0.5 + result!.scores.heuristic * 0.5)
    );
  });
});
