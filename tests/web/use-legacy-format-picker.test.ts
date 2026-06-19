import { describe, expect, it } from "vitest";
import { isLegacyFormatPickerEnabled } from "../../apps/web/src/app/generation/lib/use-legacy-format-picker.js";
import { DEFAULT_FEATURE_FLAGS } from "../../packages/feature-flags/src/defaults.js";

describe("legacy format picker", () => {
  it("registers generation.legacy_format_picker as disabled by default", () => {
    const flag = DEFAULT_FEATURE_FLAGS.find((entry) => entry.key === "generation.legacy_format_picker");

    expect(flag).toMatchObject({
      scope: "generation",
      enabled: false,
      defaultVariant: "off",
      variants: ["off", "on"]
    });
  });

  it("enables legacy picker only when VITE_LEGACY_FORMAT_PICKER is true", () => {
    expect(isLegacyFormatPickerEnabled({})).toBe(false);
    expect(isLegacyFormatPickerEnabled({ VITE_LEGACY_FORMAT_PICKER: "false" })).toBe(false);
    expect(isLegacyFormatPickerEnabled({ VITE_LEGACY_FORMAT_PICKER: "true" })).toBe(true);
  });
});
