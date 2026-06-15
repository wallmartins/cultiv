import { describe, expect, it } from "vitest";
import { classifyGenerationDomain } from "../../packages/text-quality/src/domain/domain-classifier.js";

describe("classifyGenerationDomain", () => {
  it("classifies career linkedin briefings as non-technical", () => {
    const profile = classifyGenerationDomain({
      contentType: "linkedin-post",
      briefing: "Escreva sobre aprendizado informal e crescimento de carreira em conversas do dia a dia."
    });

    expect(profile.domain).toBe("non-technical");
    expect(profile.allowTechnicalLexicon).toBe(false);
  });

  it("classifies architecture content type as technical", () => {
    const profile = classifyGenerationDomain({
      contentType: "architecture-post",
      briefing: "Explique tradeoffs de um sistema distribuído."
    });

    expect(profile.domain).toBe("technical");
    expect(profile.allowTechnicalLexicon).toBe(true);
  });

  it("classifies mixed briefing signals as mixed", () => {
    const profile = classifyGenerationDomain({
      contentType: "long-form-blog",
      briefing: "Fale sobre liderança de carreira e quando faz sentido adotar uma API interna para acelerar o time."
    });

    expect(profile.domain).toBe("mixed");
  });

  it("allows technical linkedin briefing to become technical", () => {
    const profile = classifyGenerationDomain({
      contentType: "linkedin-post",
      briefing: "Compartilhe lições de um deploy de microservices e tradeoffs de cache em produção."
    });

    expect(profile.domain).toBe("technical");
  });
});
