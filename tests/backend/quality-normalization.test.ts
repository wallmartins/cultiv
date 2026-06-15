import { describe, expect, it } from "vitest";
import { stripTemplateHeaders } from "../../apps/backend/src/execution/quality/quality-normalization.js";

describe("stripTemplateHeaders", () => {
  it("removes template headers from LLM output", () => {
    const raw = `Finalize Topic: My topic
Briefing: Some briefing text
Drafting against: previous content
Voice markers: short paragraphs
Voice rules: be direct
Format contract: Write as LinkedIn post
Output rules: Do not mention drafting
Instruction: Rewrite this

Here is the actual content that should remain.`;

    const cleaned = stripTemplateHeaders(raw);

    expect(cleaned).not.toContain("Finalize");
    expect(cleaned).not.toContain("Briefing:");
    expect(cleaned).not.toContain("Drafting against:");
    expect(cleaned).not.toContain("Voice markers:");
    expect(cleaned).not.toContain("Voice rules:");
    expect(cleaned).not.toContain("Format contract:");
    expect(cleaned).not.toContain("Output rules:");
    expect(cleaned).not.toContain("Instruction:");
    expect(cleaned).toContain("Here is the actual content that should remain.");
  });

  it("handles continuous text with embedded headers", () => {
    const raw = `Finalize Topic: My topic Briefing: Some briefing Voice markers: short paragraphs Here is the actual final content that should remain.`;

    const cleaned = stripTemplateHeaders(raw);

    expect(cleaned).not.toContain("Finalize");
    expect(cleaned).not.toContain("Topic:");
    expect(cleaned).not.toContain("Briefing:");
    expect(cleaned).not.toContain("Voice markers:");
    expect(cleaned).toContain("Here is the actual final content that should remain.");
  });

  it("strips real LLM echo output", () => {
    const raw = `Finalize Topic: Versioned AI routing profiles para preservação de voz autoral Briefing: Topic: Versioned AI routing profiles para preservação de voz autoral | Goal: Explicar como snapshots de política e ativação controlada reduzem deriva de execução e garantem que a IA respeite a voz do usuário sem surpresas | Audience: engenheiros de plataforma Previous content: A estabilidade de um sistema de inteligência artificial em larga escala transcende a qualidade do modelo subjacente; ela reside na precisão com que as diretrizes de execução são aplicadas de forma contínua.`;

    const cleaned = stripTemplateHeaders(raw);

    expect(cleaned).not.toContain("Finalize");
    expect(cleaned).not.toContain("Topic:");
    expect(cleaned).not.toContain("Briefing:");
    expect(cleaned).not.toContain("Goal:");
    expect(cleaned).not.toContain("Audience:");
    expect(cleaned).not.toContain("Previous content:");
    expect(cleaned).toContain("A estabilidade de um sistema de inteligência artificial");
  });

  it("extracts only the real generated text after Previous content marker", () => {
    const raw = `Finalize Topic: Versioned AI routing profiles para preservação de voz autoral Briefing: Topic: Versioned AI routing profiles para preservação de voz autoral | Goal: Explicar como snapshots de política e ativação controlada reduzem deriva de execução e garantem que a IA respeite a voz do usuário sem surpresas | Audience: engenheiros de plataforma Previous content: A integridade da voz autoral em sistemas de inteligência artificial generativa enfrenta um desafio persistente: a deriva silenciosa das diretrizes de roteamento.`;

    const cleaned = stripTemplateHeaders(raw);

    // Deve conter APENAS o texto gerado, sem metadados do prompt
    expect(cleaned).toBe(
      "A integridade da voz autoral em sistemas de inteligência artificial generativa enfrenta um desafio persistente: a deriva silenciosa das diretrizes de roteamento."
    );
  });

  it("preserves normal text that happens to contain colons", () => {
    const raw = `Result: this is a valid sentence with a colon.
Another line: also valid.

The conclusion: everything is fine.`;

    const cleaned = stripTemplateHeaders(raw);

    expect(cleaned).toContain("Result: this is a valid sentence with a colon.");
    expect(cleaned).toContain("Another line: also valid.");
    expect(cleaned).toContain("The conclusion: everything is fine.");
  });
});
