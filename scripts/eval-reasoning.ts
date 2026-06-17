#!/usr/bin/env tsx
import { readFileSync, readdirSync } from "node:fs";
import { resolve } from "node:path";
import { evaluateReasoningDrift } from "@my-ai-orchestrator/text-quality";
import type { CoreReasoningSignature } from "@my-ai-orchestrator/contracts";

interface PersonaFixture {
  readonly id: string;
  readonly coreReasoningSignature: CoreReasoningSignature;
  readonly briefings: readonly string[];
  readonly badCandidates?: readonly string[];
}

const fixtureDir = resolve(import.meta.dirname, "../tests/fixtures/reasoning-regression");

function loadPersonas(): PersonaFixture[] {
  return readdirSync(fixtureDir)
    .filter((file) => file.endsWith(".json"))
    .map((file) => JSON.parse(readFileSync(resolve(fixtureDir, file), "utf8")) as PersonaFixture);
}

function main() {
  const personas = loadPersonas();
  let briefingCount = 0;
  let failures = 0;

  console.log(`Evaluating ${personas.length} reasoning personas...`);

  for (const persona of personas) {
    briefingCount += persona.briefings.length;
    const candidates = persona.badCandidates ?? [
      "Obviamente todo mundo sempre deveria fazer assim sem exceção.",
      "Portanto a conclusão é clara. Depois ainda há mais contexto."
    ];

    for (const candidate of candidates) {
      const drift = evaluateReasoningDrift(persona.coreReasoningSignature, candidate, "draft");
      if (drift.score >= 80) {
        failures += 1;
        console.log(`[fail] ${persona.id}: drift=${drift.score} notes=${drift.notes.join("; ")}`);
      } else {
        console.log(`[pass] ${persona.id}: drift=${drift.score}`);
      }
    }
  }

  console.log(`Briefings in corpus: ${briefingCount}`);
  console.log(`Failures: ${failures}`);

  if (personas.length < 6 || briefingCount < 30) {
    console.error("Corpus threshold not met (need >=6 personas and >=30 briefings).");
    process.exit(1);
  }

  process.exit(failures > 0 ? 1 : 0);
}

main();
