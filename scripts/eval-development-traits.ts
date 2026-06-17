#!/usr/bin/env tsx
import { readFileSync, readdirSync } from "node:fs";
import { resolve } from "node:path";
import { applyTraitConfidencePass } from "../apps/backend/src/product/voice/trait-confidence-pass.js";
import type { DevelopmentTraits, TraitKey } from "@my-ai-orchestrator/contracts";

interface TraitsPersonaFixture {
  readonly id: string;
  readonly expectedTraits: DevelopmentTraits;
  readonly argumentDevelopmentSignature?: {
    readonly developmentProse: string;
    readonly moveLabels: readonly string[];
    readonly transitionTendencies: readonly { readonly from: string; readonly to: string; readonly frequency: string }[];
    readonly epistemicPosture: "exploratory" | "investigative" | "advocacy_mixed";
    readonly structuralAntiPatterns: readonly string[];
  };
}

const fixtureDir = resolve(import.meta.dirname, "../tests/fixtures/reasoning-regression");

function loadPersonas(): TraitsPersonaFixture[] {
  return readdirSync(fixtureDir)
    .filter((file) => file.endsWith(".json"))
    .map((file) => JSON.parse(readFileSync(resolve(fixtureDir, file), "utf8")) as TraitsPersonaFixture)
    .filter((persona) => persona.expectedTraits !== undefined);
}

function main() {
  const personas = loadPersonas();
  let failures = 0;

  console.log(`Evaluating ${personas.length} development trait personas...`);

  for (const persona of personas) {
    const development = persona.argumentDevelopmentSignature;
    if (!development) {
      failures += 1;
      console.log(`[fail] ${persona.id}: missing argumentDevelopmentSignature`);
      continue;
    }

    const traitEvidence = Object.fromEntries(
      (Object.keys(persona.expectedTraits) as TraitKey[]).map((key) => [
        key,
        [
          { exampleIndex: 1, value: persona.expectedTraits[key] },
          { exampleIndex: 2, value: persona.expectedTraits[key] },
          { exampleIndex: 3, value: persona.expectedTraits[key] }
        ]
      ])
    );

    const result = applyTraitConfidencePass({
      traits: persona.expectedTraits,
      traitEvidence,
      development,
      activeExamples: [
        { id: `${persona.id}-1`, state: "active" } as never,
        { id: `${persona.id}-2`, state: "active" } as never,
        { id: `${persona.id}-3`, state: "active" } as never
      ]
    });

    if (!result) {
      failures += 1;
      console.log(`[fail] ${persona.id}: confidence pass returned undefined`);
      continue;
    }

    for (const key of Object.keys(persona.expectedTraits) as TraitKey[]) {
      const expected = persona.expectedTraits[key];
      const actual = result.profile.traits[key] ?? result.profile.records[key]?.value;
      if (actual !== expected) {
        failures += 1;
        console.log(`[fail] ${persona.id}.${key}: expected=${expected} actual=${actual}`);
      }
    }

    if (failures === 0) {
      console.log(`[pass] ${persona.id}`);
    }
  }

  console.log(`Failures: ${failures}`);

  if (personas.length < 6) {
    console.error("Corpus threshold not met (need >=6 personas with expectedTraits).");
    process.exit(1);
  }

  process.exit(failures > 0 ? 1 : 0);
}

main();
