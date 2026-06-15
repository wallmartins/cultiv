import { describe, expect, it } from "vitest";
import {
  buildShowcaseApiRunRequest,
  buildShowcaseMeExecutionRequest,
  getShowcaseGenericPrompt
} from "../../apps/web/src/marketing/content/showcase/generation/index.js";
import { SHOWCASE_THEME_IDS } from "../../apps/web/src/marketing/content/showcase/themes/index.js";
import { getShowcaseSamples } from "../../apps/web/src/marketing/content/showcase/get-samples.js";

describe("showcase generation specs", () => {
  it("builds backend requests for every theme and locale", () => {
    for (const themeId of SHOWCASE_THEME_IDS) {
      for (const locale of ["pt", "en"] as const) {
        const meRequest = buildShowcaseMeExecutionRequest(themeId, locale);
        const apiRequest = buildShowcaseApiRunRequest(themeId, locale);

        expect(meRequest.contentType).toBe(apiRequest.pipelineType);
        expect(meRequest.briefing).toEqual(apiRequest.briefing);
        expect(meRequest.language).toBe(apiRequest.language);
        expect(typeof meRequest.briefing).toBe("object");
        expect(getShowcaseGenericPrompt(themeId, locale).length).toBeGreaterThan(80);
      }
    }
  });

  it("attaches generation metadata to showcase samples", () => {
    for (const sample of getShowcaseSamples("pt")) {
      expect(sample.generation.themeId).toBe(sample.id);
      expect(sample.generation.briefingInput.topic).toBeTruthy();
      expect(sample.generation.genericPrompt.toLowerCase()).toMatch(/minha voz|como eu|soe como eu|pareça que eu/);
    }

    for (const sample of getShowcaseSamples("en")) {
      expect(sample.generation.language).toBe("en-US");
      expect(sample.generation.genericPrompt.toLowerCase()).toMatch(/my voice|how i|sound like me|sound like i/);
    }
  });
});
