import { describe, expect, it } from "vitest";
import { authorizeLexicalOutput } from "../../packages/text-quality/src/gates/lexical-release-gate.js";
import type { ContentTypeQualityProfile } from "../../packages/text-quality/src/quality/content-type-quality-profile.js";

// F6-1 stripped the domain-conditional `non-technical && techTermHits` branch from the gate's
// hard-reject; these tests lock in the surviving neutral-only behaviour so a future edit can't
// silently reintroduce a domain condition (ADR 0010 §8/§9 — the ruler stays neutral).

const profile = (lexicalGateMode: ContentTypeQualityProfile["lexicalGateMode"]): ContentTypeQualityProfile => ({
  criticWeight: 0.3,
  fidelityWeight: 0.4,
  driftWeight: 0.25,
  lexicalGateMode
});

// An em dash (U+2014) is one of the three neutral hard-reject signals (concentration / lemma repeat / em dash).
const emDashText = "O time entregou o projeto no prazo — mas a qualidade ficou abaixo do esperado pelos usuários.";
// Enough distinct content tokens that top-term concentration stays under the 0.08 finding floor.
const cleanText =
  "Escrevo sobre decisões difíceis de produto usando exemplos concretos, histórias reais e perguntas honestas para leitores curiosos.";

describe("authorizeLexicalOutput", () => {
  it("passes unconditionally when lexicalQualityV2 is off", () => {
    const result = authorizeLexicalOutput({ text: emDashText, profile: profile("strict"), lexicalQualityV2: false });
    expect(result.decision).toBe("pass");
    expect(result.reasons).toEqual([]);
  });

  it("passes unconditionally when the gate mode is off", () => {
    const result = authorizeLexicalOutput({ text: emDashText, profile: profile("off"), lexicalQualityV2: true });
    expect(result.decision).toBe("pass");
    expect(result.reasons).toEqual([]);
  });

  it("surfaces findings as reasons but never rejects in penalize mode", () => {
    const result = authorizeLexicalOutput({ text: emDashText, profile: profile("penalize"), lexicalQualityV2: true });
    expect(result.decision).toBe("pass");
    expect(result.reasons.length).toBeGreaterThan(0);
  });

  it("rejects on a neutral hard-reject signal (em dash) in strict mode", () => {
    const result = authorizeLexicalOutput({ text: emDashText, profile: profile("strict"), lexicalQualityV2: true });
    expect(result.decision).toBe("reject");
    expect(result.reasons).toContain("Text uses em dashes instead of commas or periods");
  });

  it("passes neutral-clean text in strict mode", () => {
    const result = authorizeLexicalOutput({ text: cleanText, profile: profile("strict"), lexicalQualityV2: true });
    expect(result.decision).toBe("pass");
    expect(result.reasons).toEqual([]);
  });
});
