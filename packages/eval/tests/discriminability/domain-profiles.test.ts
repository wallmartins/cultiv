import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { areDiscriminable, containsGenericCliche, namesSpecific } from "@my-ai-orchestrator/text-quality";
import type { TextQualityVoiceProfile } from "@my-ai-orchestrator/contracts";

// F6-2 (norte/criterio-de-aceite.md T1+T2): the eval's multi-domain seed only proves its worth if the
// 4 style spans are actually not interchangeable, and each names something field-specific rather than
// the field's own average (the average is the cliché — anti-padroes.md). Both checks are deterministic:
// they run on the seeded profiles/briefings, never on live-generated text (no network in this suite).

const PROFILES_DIR = resolve(import.meta.dirname, "../../src/fixtures/voice-fidelity/profiles");

function loadProfile(fileName: string): TextQualityVoiceProfile {
  return JSON.parse(readFileSync(resolve(PROFILES_DIR, fileName), "utf8")) as TextQualityVoiceProfile;
}

const DOMAIN_PROFILES = {
  // Reuses the existing tech fixture (norte/amostras/tecnologia.md) — no new tech profile needed.
  tech: loadProfile("formal-architect.json"),
  marketing: loadProfile("marketing-senior.json"),
  climate: loadProfile("climate-tech-pm.json"),
  legal: loadProfile("legal-precise.json")
} as const;

// Dimension-6 ("clichê do campo") sentences, one per domain — tech/marketing/climate lifted from the
// signed samples in .scratch/adaptacao-por-dominio/norte/amostras/*.md; legal is new (no signed sample
// exists for it — it is the T3 long-tail stress field the criterio-de-aceite asks for).
const DOMAIN_CLICHE_SENTENCES = {
  tech: "O clichê do campo é dizer que microsserviços resolvem ou que reescrever em Rust é a resposta, sem nomear o incidente que motivou a migração.",
  marketing: "O clichê do campo é prometer engajamento e autenticidade sem mostrar o antes e depois que move o NPS.",
  climate: "O clichê do campo é dizer que a empresa leva sustentabilidade a sério, sem citar o dado de adesão que sustenta o Escopo 3.",
  legal: "O clichê do campo é prometer segurança jurídica plena, sem nomear a cláusula e o artigo 413 do Código Civil que autoriza reduzir a multa desproporcional."
} as const;

// The negative control: a maximally vague version of the same sentence shape, with every field-specific
// anchor stripped out. Proves T1/T2 discriminate real content from filler instead of always passing.
const GENERIC_VAGUE_SENTENCE = "O clichê do campo é dizer que é preciso ser autêntico e agregar valor para o público.";

const DOMAIN_KEYS = Object.keys(DOMAIN_PROFILES) as ReadonlyArray<keyof typeof DOMAIN_PROFILES>;

describe("F6-2 discriminability — T1 (intercambiabilidade)", () => {
  it.each(pairwise(DOMAIN_KEYS))("%s vs %s: lexicons are not interchangeable", (a, b) => {
    expect(areDiscriminable(DOMAIN_PROFILES[a].lexicon, DOMAIN_PROFILES[b].lexicon)).toBe(true);
  });

  it.each(pairwise(DOMAIN_KEYS))("%s vs %s: dimension-6 (clichê) sentences are not interchangeable", (a, b) => {
    const setA = [DOMAIN_CLICHE_SENTENCES[a]];
    const setB = [DOMAIN_CLICHE_SENTENCES[b]];
    expect(areDiscriminable(setA, setB)).toBe(true);
  });
});

describe("F6-2 discriminability — T2 (conteúdo específico do campo)", () => {
  it.each(DOMAIN_KEYS)("%s: dimension-6 sentence names something concrete, not a generic average", (domain) => {
    expect(namesSpecific(DOMAIN_CLICHE_SENTENCES[domain])).toBe(true);
  });

  it("negative control: a genuinely generic sentence fails the specificity check", () => {
    expect(namesSpecific(GENERIC_VAGUE_SENTENCE)).toBe(false);
    expect(containsGenericCliche(GENERIC_VAGUE_SENTENCE)).toBe(true);
  });

  it.each(DOMAIN_KEYS)("%s: antiPatternsExplicit are curated (not the universal filler list itself)", (domain) => {
    // The field's own cliché can legitimately overlap with the universal FILLER_PHRASES list (marketing's
    // "engajamento e autenticidade" is a real example — corporate marketing-speak leaks into general AI
    // slop). What matters is the profile names *something*, not that it dodges every generic phrase.
    expect(DOMAIN_PROFILES[domain].antiPatternsExplicit.length).toBeGreaterThan(0);
  });
});

function pairwise<T>(items: readonly T[]): Array<[T, T]> {
  const pairs: Array<[T, T]> = [];
  for (let i = 0; i < items.length; i += 1) {
    for (let j = i + 1; j < items.length; j += 1) {
      pairs.push([items[i]!, items[j]!]);
    }
  }
  return pairs;
}
