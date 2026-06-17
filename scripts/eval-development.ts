#!/usr/bin/env tsx
import { readFileSync, readdirSync } from "node:fs";
import { resolve } from "node:path";
import { evaluateArgumentDevelopmentDrift } from "@my-ai-orchestrator/text-quality";
import type { ArgumentDevelopmentSignature } from "@my-ai-orchestrator/contracts";

interface DevelopmentPersonaFixture {
  readonly id: string;
  readonly argumentDevelopmentSignature: ArgumentDevelopmentSignature;
  readonly developmentBadCandidates?: readonly string[];
}

const fixtureDir = resolve(import.meta.dirname, "../tests/fixtures/reasoning-regression");

function loadPersonas(): DevelopmentPersonaFixture[] {
  return readdirSync(fixtureDir)
    .filter((file) => file.endsWith(".json"))
    .map((file) => JSON.parse(readFileSync(resolve(fixtureDir, file), "utf8")) as DevelopmentPersonaFixture)
    .filter((persona) => persona.argumentDevelopmentSignature !== undefined);
}

function main() {
  const personas = loadPersonas();
  let failures = 0;

  console.log(`Evaluating ${personas.length} development personas...`);

  for (const persona of personas) {
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
      if (drift.score >= 80) {
        failures += 1;
        console.log(`[fail] ${persona.id}: drift=${drift.score} notes=${drift.notes.join("; ")}`);
      } else {
        console.log(`[pass] ${persona.id}: drift=${drift.score}`);
      }
    }
  }

  console.log(`Failures: ${failures}`);

  if (personas.length < 6) {
    console.error("Corpus threshold not met (need >=6 personas with development signatures).");
    process.exit(1);
  }

  process.exit(failures > 0 ? 1 : 0);
}

main();
