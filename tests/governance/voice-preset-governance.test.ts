import { describe, expect, it } from "vitest";
import { COGNITIVE_PRESET_RULE_MARKERS, resolveContentTypeVoicePreset } from "../../apps/backend/src/product/voice/voice-presets.js";

describe("voice preset governance", () => {
  it("does not inject cognitive narrative rules into content type presets", () => {
    const contentTypes = [
      "linkedin-post",
      "twitter-thread",
      "newsletter",
      "long-form-blog",
      "validation-post",
      "architecture-post"
    ];

    for (const contentType of contentTypes) {
      const preset = resolveContentTypeVoicePreset(contentType);
      const serialized = JSON.stringify(preset).toLowerCase();

      for (const marker of COGNITIVE_PRESET_RULE_MARKERS) {
        expect(serialized).not.toContain(marker);
      }
    }
  });
});
