import { describe, expect, it } from "vitest";
import { appMessagesEn } from "../../apps/web/src/i18n/app/messages/en";
import { appMessagesPt } from "../../apps/web/src/i18n/app/messages/pt";
import { getQualityModeHelpDetail, getQualityModeHelpScreenReaderText, getQualityModeTooltip } from "../../apps/web/src/i18n/app/quality-mode-tooltips.js";

describe("quality mode tooltips", () => {
  it("includes the minimum plan name when a mode is blocked by tier", () => {
    const tooltip = getQualityModeTooltip("pt", "strict", appMessagesPt, {
      allowed: false,
      blockedReason: "quality_mode_plan_restriction"
    });

    expect(tooltip).toContain("Pro");
    expect(tooltip).toContain("Disponível a partir do plano Pro");
  });

  it("mentions insufficient credits when that is the blocker", () => {
    const tooltip = getQualityModeTooltip("en", "fast", appMessagesEn, {
      allowed: false,
      blockedReason: "insufficient_credits"
    });

    expect(tooltip).toContain("Not enough credits");
  });

  it("shows only the description when the mode is allowed", () => {
    const tooltip = getQualityModeTooltip("pt", "fast", appMessagesPt, {
      allowed: true
    });

    expect(tooltip).toBe(appMessagesPt.qualityModes.descriptions.fast);
    expect(tooltip).not.toContain("Disponível a partir");
  });

  it("builds structured help detail with overview and mode copy", () => {
    const detail = getQualityModeHelpDetail("pt", "balanced", appMessagesPt, { allowed: true });

    expect(detail.modeLabel).toBe(appMessagesPt.qualityModes.balanced);
    expect(detail.description).toBe(appMessagesPt.qualityModes.descriptions.balanced);
    expect(detail.footnote).toBeUndefined();
  });

  it("combines overview and mode detail for screen readers", () => {
    const text = getQualityModeHelpScreenReaderText("en", "strict", appMessagesEn, { allowed: true });

    expect(text).toContain(appMessagesEn.qualityModes.helper);
    expect(text).toContain(appMessagesEn.qualityModes.strict);
    expect(text).toContain(appMessagesEn.qualityModes.descriptions.strict);
  });
});
