import { describe, expect, it } from "vitest";
import {
  areDiscriminable,
  fieldSpecificityReport,
  interchangeabilityScore,
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
