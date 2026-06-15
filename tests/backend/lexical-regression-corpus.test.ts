import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { classifyGenerationDomain } from "../../packages/text-quality/src/domain/domain-classifier.js";
import { resolveOutputWordTargetForFormatName } from "../../packages/text-quality/src/format/output-length.js";

interface RegressionBriefing {
  readonly id: string;
  readonly contentType: string;
  readonly language: string;
  readonly expectedDomain: "non-technical" | "technical" | "mixed";
  readonly briefing: string;
}

const fixturePath = resolve(dirname(fileURLToPath(import.meta.url)), "../fixtures/lexical-regression/briefings.json");
const briefings = JSON.parse(readFileSync(fixturePath, "utf8")) as RegressionBriefing[];

describe("lexical regression corpus", () => {
  it("classifies fixture briefings to their expected domain", () => {
    for (const fixture of briefings) {
      const profile = classifyGenerationDomain({
        contentType: fixture.contentType,
        briefing: fixture.briefing
      });

      expect(profile.domain, fixture.id).toBe(fixture.expectedDomain);
    }
  });

  it("defines word targets for every fixture content type", () => {
    for (const fixture of briefings) {
      const target = resolveOutputWordTargetForFormatName(fixture.contentType);
      expect(target.minWords, fixture.id).toBeGreaterThan(0);
      expect(target.maxWords, fixture.id).toBeGreaterThan(target.minWords);
    }
  });
});
