import { describe, expect, it } from "vitest";
import { evaluateArgumentDevelopmentDrift } from "@my-ai-orchestrator/text-quality";
import { TEST_ARGUMENT_DEVELOPMENT_EXTRACTION_FIXTURE } from "../../apps/backend/src/product/voice/argument-development-extraction.js";

describe("argument development drift", () => {
  it("penalizes premature thesis for exploratory development", () => {
    const result = evaluateArgumentDevelopmentDrift(
      TEST_ARGUMENT_DEVELOPMENT_EXTRACTION_FIXTURE.development,
      "Portanto, a conclusão é que você deve sempre fazer assim.\n\nO certo é seguir este caminho sem hesitar.",
      "draft"
    );

    expect(result.score).toBeLessThan(70);
    expect(result.notes.length).toBeGreaterThan(0);
  });

  it("returns a neutral score when development signature is absent", () => {
    expect(evaluateArgumentDevelopmentDrift(undefined, "Any candidate", "draft").score).toBe(100);
  });

  it("does not penalize candidates for missing move label substrings", () => {
    const result = evaluateArgumentDevelopmentDrift(
      TEST_ARGUMENT_DEVELOPMENT_EXTRACTION_FIXTURE.development,
      "Começo pela experiência vivida, tolero a dúvida e testo a ideia em um caso concreto antes de concluir.",
      "draft"
    );

    expect(result.score).toBeGreaterThanOrEqual(70);
    expect(result.notes.some((note) => note.includes("argumentative moves"))).toBe(false);
  });
});
