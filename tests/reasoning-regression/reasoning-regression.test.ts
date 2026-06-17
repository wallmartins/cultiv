import { readFileSync, readdirSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { evaluateReasoningDrift } from "@my-ai-orchestrator/text-quality";
import type { CoreReasoningSignature } from "@my-ai-orchestrator/contracts";

const fixtureDir = resolve(import.meta.dirname, "../fixtures/reasoning-regression");

interface PersonaFixture {
  readonly id: string;
  readonly coreReasoningSignature: CoreReasoningSignature;
  readonly briefings: readonly string[];
  readonly badCandidates?: readonly string[];
}

function loadPersonas(): PersonaFixture[] {
  return readdirSync(fixtureDir)
    .filter((file) => file.endsWith(".json"))
    .map((file) => JSON.parse(readFileSync(resolve(fixtureDir, file), "utf8")) as PersonaFixture);
}

describe("reasoning regression corpus", () => {
  const personas = loadPersonas();
  const briefingCount = personas.reduce((total, persona) => total + persona.briefings.length, 0);

  it("meets corpus size thresholds", () => {
    expect(personas.length).toBeGreaterThanOrEqual(6);
    expect(briefingCount).toBeGreaterThanOrEqual(30);
  });

  it.each(personas)("flags anti-pattern drift for $id bad candidates", (persona) => {
    const candidates = persona.badCandidates ?? [
      "Obviamente todo mundo sempre deveria fazer assim.",
      "Portanto a conclusão é clara sem mais contexto."
    ];

    for (const candidate of candidates) {
      const drift = evaluateReasoningDrift(persona.coreReasoningSignature, candidate, "draft");
      expect(drift.score, `${persona.id}: ${candidate}`).toBeLessThan(80);
    }
  });
});
