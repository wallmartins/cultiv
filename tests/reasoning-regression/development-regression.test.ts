import { readFileSync, readdirSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { evaluateArgumentDevelopmentDrift } from "@my-ai-orchestrator/text-quality";
import type { ArgumentDevelopmentSignature } from "@my-ai-orchestrator/contracts";

const fixtureDir = resolve(import.meta.dirname, "../fixtures/reasoning-regression");

interface DevelopmentPersonaFixture {
  readonly id: string;
  readonly argumentDevelopmentSignature: ArgumentDevelopmentSignature;
  readonly developmentBadCandidates?: readonly string[];
}

function loadPersonas(): DevelopmentPersonaFixture[] {
  return readdirSync(fixtureDir)
    .filter((file) => file.endsWith(".json"))
    .map((file) => JSON.parse(readFileSync(resolve(fixtureDir, file), "utf8")) as DevelopmentPersonaFixture)
    .filter((persona) => persona.argumentDevelopmentSignature !== undefined);
}

describe("development regression corpus", () => {
  const personas = loadPersonas();

  it("includes development signatures for all personas", () => {
    expect(personas.length).toBeGreaterThanOrEqual(6);
  });

  it.each(personas)("flags development drift for $id bad candidates", (persona) => {
    const candidates = persona.developmentBadCandidates ?? [
      "Portanto a conclusão é clara: você deve sempre fazer assim.",
      "O certo é seguir este caminho sem hesitar."
    ];

    for (const candidate of candidates) {
      const drift = evaluateArgumentDevelopmentDrift(
        persona.argumentDevelopmentSignature,
        candidate,
        "draft"
      );
      expect(drift.score, `${persona.id}: ${candidate}`).toBeLessThan(80);
    }
  });
});
