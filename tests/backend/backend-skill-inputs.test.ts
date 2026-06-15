import { describe, expect, it } from "vitest";
import { getBriefingText } from "../../apps/backend/src/execution/skill-inputs.js";

describe("backend skill inputs", () => {
  it("appends sanitized imported context to the runtime briefing text", () => {
    const briefingText = getBriefingText({
      briefing: {
        topic: "Rollout de policy",
        audience: "time interno"
      },
      importedContext: "Notas externas em texto puro"
    });

    expect(briefingText).toContain("Topic: Rollout de policy");
    expect(briefingText).toContain("Audience: time interno");
    expect(briefingText).toContain("Imported context: Notas externas em texto puro");
  });

  it("keeps runtime metadata out of fallback briefing assembly for explicit inputs", () => {
    const briefingText = getBriefingText({
      topic: "Runtime minimization",
      importedContext: "Notas externas",
      language: "pt-BR",
      contentType: "custom-flow",
      qualityMode: "strict"
    });

    expect(briefingText).toContain("\"topic\":\"Runtime minimization\"");
    expect(briefingText).toContain("Imported context: Notas externas");
    expect(briefingText).not.toContain("contentType");
    expect(briefingText).not.toContain("qualityMode");
    expect(briefingText).not.toContain("language");
  });
});
