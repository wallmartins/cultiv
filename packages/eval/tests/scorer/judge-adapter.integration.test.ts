import { describe, expect, it } from "vitest";
import type { TextQualityVoiceProfile } from "@my-ai-orchestrator/contracts";
import { createJudgeAdapter } from "../../src/scorer/judge-adapter.js";
import { scoreWithJudge } from "../../src/scorer/judge.js";

const hasApiKey = Boolean(process.env.GROQ_API_KEY ?? process.env.OPENAI_API_KEY);

const voiceProfile: TextQualityVoiceProfile = {
  userId: "eval-formal-architect",
  tone: "formal",
  cadence: "measured",
  description: "Builds arguments through explicit tradeoffs, technical constraints, and implementation realities rather than slogans.",
  antiPatterns: ["hand-wavy wording", "impersonal whitepaper tone"],
  antiPatternsExplicit: ["game-changer", "revolutionary"],
  rules: ["open with the decision at stake", "close with a measured recommendation"],
  lexicon: ["tradeoff", "constraint", "abstraction"],
  userLabels: ["formal", "technical"],
  coreReasoningSignature: {
    narrativeProse: "Builds arguments through explicit tradeoffs, technical constraints, and implementation realities rather than slogans.",
    certaintyLevel: "moderate",
    judgmentFrequency: "moderate",
    conclusionPace: "moderate",
    readerRelationship: "peer",
    authoritySource: "practice",
    derivedAntiPatterns: ["hand-wavy wording"]
  },
  argumentDevelopmentSignature: {
    developmentProse: "Frames decisions through explicit tradeoffs, names constraints, and lands on a measured recommendation.",
    moveLabels: ["constraint", "tradeoff", "recommendation"],
    transitionTendencies: [{ from: "constraint", to: "tradeoff", frequency: "common" }],
    epistemicPosture: "investigative",
    structuralAntiPatterns: ["hand_wavy_claim"]
  }
};

describe.skipIf(!hasApiKey)("judge adapter integration", () => {
  it("scores a candidate text against a voice profile", async () => {
    const adapter = createJudgeAdapter();
    const candidate =
      "Microservices are a game-changer. They unlock potential and revolutionize how teams build software.";

    const score = await scoreWithJudge(candidate, voiceProfile, adapter);

    expect(score).not.toBeNull();
    expect(score!.score).toBeGreaterThanOrEqual(0);
    expect(score!.score).toBeLessThanOrEqual(100);
    expect(score!.rationale.length).toBeGreaterThan(10);
    expect(score!.provider).toBe(adapter.provider);
    expect(score!.model).toBe(adapter.model);
  }, 60000);
});
