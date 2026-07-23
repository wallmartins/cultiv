import { describe, expect, it } from "vitest";
import type { GenerationChannel } from "@my-ai-orchestrator/contracts";
import { COGNITIVE_PRESET_RULE_MARKERS, resolveChannelVoicePreset } from "../../apps/backend/src/product/voice/voice-presets.js";

describe("voice preset governance", () => {
  it("does not inject cognitive narrative rules into channel presets", () => {
    const channels: readonly GenerationChannel[] = [
      "unspecified",
      "professional-network",
      "blog",
      "email",
      "social"
    ];

    for (const channel of channels) {
      const preset = resolveChannelVoicePreset(channel);
      const serialized = JSON.stringify(preset).toLowerCase();

      for (const marker of COGNITIVE_PRESET_RULE_MARKERS) {
        expect(serialized).not.toContain(marker);
      }
    }
  });
});
