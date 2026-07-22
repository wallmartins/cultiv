import { describe, expect, it } from "vitest";
import {
  areDiscriminable,
  containsGenericCliche,
  fieldSpecificityReport,
  interchangeabilityScore,
  namesSpecific,
  survivesLabelSwap
} from "../../src/discriminability/discriminability.js";

describe("survivesLabelSwap", () => {
  it("flags generic filler that any field could reuse verbatim", () => {
    expect(survivesLabelSwap("é importante agregar valor")).toBe(true);
  });

  it("clears a field anchored in a named specific", () => {
    expect(survivesLabelSwap("a 2M linhas o join levava 40s")).toBe(false);
  });

  it("treats an empty field as a survivor", () => {
    expect(survivesLabelSwap("   ")).toBe(true);
  });
});

describe("namesSpecific", () => {
  it("accepts mixed-case product names as named specifics", () => {
    expect(namesSpecific("a migração para PostgreSQL travou o deploy")).toBe(true);
    expect(namesSpecific("o time adotou TypeScript no monorepo")).toBe(true);
  });

  it("accepts internal-capital brands even at sentence start", () => {
    expect(namesSpecific("iOS mudou a regra de background refresh")).toBe(true);
    expect(namesSpecific("eBay é o contra-exemplo clássico")).toBe(true);
  });

  it("accepts mid-sentence all-caps acronyms", () => {
    expect(namesSpecific("o incidente na AWS derrubou o checkout")).toBe(true);
    expect(namesSpecific("a LGPD exige base legal para o tratamento")).toBe(true);
  });

  it("rejects all-caps emphasis words — only acronym-shaped all-caps count", () => {
    expect(namesSpecific("isso é MUITO importante para o time")).toBe(false);
    expect(namesSpecific("É ENORME o impacto disso no produto")).toBe(false);
  });

  it("accepts dotted brand names, including at the end of a sentence", () => {
    expect(namesSpecific("plataformas gerenciadas como Fly.io tiram a dor")).toBe(true);
    expect(namesSpecific("a alternativa era migrar para Node.js.")).toBe(true);
  });

  it("accepts accented pt-BR proper nouns mid-sentence", () => {
    expect(namesSpecific("o relatório da Ângela sobre o caso")).toBe(true);
  });

  it("rejects a capitalized sentence start without other specifics", () => {
    expect(namesSpecific("Melhores práticas ajudam o time. Pense nisso.")).toBe(false);
  });

  it("rejects generic prose and empty text", () => {
    expect(namesSpecific("é importante engajar seu público")).toBe(false);
    expect(namesSpecific("   ")).toBe(false);
  });

  it("still accepts digits and quoted terms", () => {
    expect(namesSpecific("o p99 caiu 40%")).toBe(true);
    expect(namesSpecific('evite o refrão de "best practices" como encerra-debate')).toBe(true);
  });
});

describe("containsGenericCliche", () => {
  it("matches the merged filler list from both former twins", () => {
    expect(containsGenericCliche("você precisa pensar fora da caixa")).toBe(true);
    expect(containsGenericCliche("pense fora da caixa sempre")).toBe(true);
    expect(containsGenericCliche("leve isso a sério")).toBe(true);
    expect(containsGenericCliche("take it seriously")).toBe(true);
    expect(containsGenericCliche("conteúdo é rei")).toBe(true);
  });

  it("ignores anchored prose", () => {
    expect(containsGenericCliche("o postmortem de 2023 mudou o runbook")).toBe(false);
  });
});

describe("fieldSpecificityReport", () => {
  it("reports per-field specificity across a mix of dimensions", () => {
    const report = fieldSpecificityReport([
      { key: "fieldCliche", value: "reescreve em Rust, 'it depends' como fuga, blast radius" },
      { key: "stake", value: "é importante engajar seu público" },
      { key: "evidence", value: "a incidente de 2 de março derrubou o checkout por 40 minutos" }
    ]);

    expect(report).toEqual([
      { key: "fieldCliche", specific: true },
      { key: "stake", specific: false },
      { key: "evidence", specific: true }
    ]);
  });
});

describe("interchangeabilityScore / areDiscriminable", () => {
  it("scores near-identical generic sets as highly interchangeable", () => {
    const setA = ["é importante agregar valor ao cliente"];
    const setB = ["é importante agregar valor ao usuário"];

    expect(interchangeabilityScore(setA, setB)).toBeGreaterThan(0.5);
    expect(areDiscriminable(setA, setB)).toBe(false);
  });

  it("scores field-distinct cliche sets as discriminable", () => {
    const techCliches = ["reescreve em Rust", "blast radius", "it depends como fuga"];
    const marketingCliches = ["engajamento e autenticidade", "conteúdo é rei", "agregar valor"];

    expect(interchangeabilityScore(techCliches, marketingCliches)).toBeLessThan(0.5);
    expect(areDiscriminable(techCliches, marketingCliches)).toBe(true);
  });
});
