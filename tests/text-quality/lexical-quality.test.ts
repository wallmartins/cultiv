import { describe, expect, it } from "vitest";
import { evaluateLexicalQuality } from "../../packages/text-quality/src/quality/lexical-quality.js";
import { classifyGenerationDomain } from "../../packages/text-quality/src/domain/domain-classifier.js";

describe("evaluateLexicalQuality", () => {
  it("penalizes repeated tech jargon on non-technical domain", () => {
    const domain = classifyGenerationDomain({
      contentType: "linkedin-post",
      briefing: "Escreva sobre aprendizado e carreira."
    });

    const evaluation = evaluateLexicalQuality(
      "Aprendi mais ouvindo pessoas do que lendo decks. O cache da conversa importa. O cache da rotina também. O cache do time define tudo.",
      domain
    );

    expect(evaluation.metrics.techTermHits).toBeGreaterThan(0);
    expect(evaluation.penalty).toBeGreaterThan(0);
  });

  it("does not penalize technical terms on technical domain", () => {
    const domain = classifyGenerationDomain({
      contentType: "architecture-post",
      briefing: "Explique tradeoffs de cache em microservices."
    });

    const evaluation = evaluateLexicalQuality(
      "Escolhemos cache distribuído porque o endpoint crítico não aguentava pressão de leitura.",
      domain
    );

    expect(evaluation.metrics.techTermHits).toBe(0);
  });
});
