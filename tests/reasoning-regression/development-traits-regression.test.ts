import { describe, expect, it } from "vitest";
import { readFileSync, readdirSync } from "node:fs";
import { resolve } from "node:path";

describe("development traits regression corpus", () => {
  it("has at least six personas with expectedTraits", () => {
    const fixtureDir = resolve(import.meta.dirname, "../fixtures/reasoning-regression");
    const personas = readdirSync(fixtureDir)
      .filter((file) => file.endsWith(".json"))
      .map((file) => JSON.parse(readFileSync(resolve(fixtureDir, file), "utf8")));

    const withTraits = personas.filter((persona) => persona.expectedTraits !== undefined);
    expect(withTraits.length).toBeGreaterThanOrEqual(6);
  });
});
