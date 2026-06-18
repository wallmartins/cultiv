import type { QualityMode } from "@my-ai-orchestrator/contracts";
import { describe, expect, it } from "vitest";
import { appMessagesEn } from "../../apps/web/src/i18n/app/messages/en";
import { appMessagesPt } from "../../apps/web/src/i18n/app/messages/pt";
import { getBlockedReason } from "../../apps/web/src/app/generation/lib/get-blocked-reason";
import { isQualityModeAllowedForUser } from "../../apps/web/src/app/generation/hooks/useGenerationCommercialGate";

describe("getBlockedReason", () => {
  it("maps plan_restriction to localized message", () => {
    expect(getBlockedReason("plan_restriction", appMessagesPt)).toBe(
      appMessagesPt.generate.blockedReasons.planRestriction
    );
  });

  it("maps feature_flag_disabled to localized message", () => {
    expect(getBlockedReason("feature_flag_disabled", appMessagesEn)).toBe(
      appMessagesEn.generate.blockedReasons.featureFlagDisabled
    );
  });

  it("maps subscription_inactive to localized message", () => {
    expect(getBlockedReason("subscription_inactive", appMessagesPt)).toBe(
      appMessagesPt.generate.blockedReasons.subscriptionInactive
    );
  });

  it("maps quality_mode_plan_restriction to localized message", () => {
    expect(getBlockedReason("quality_mode_plan_restriction", appMessagesEn)).toBe(
      appMessagesEn.generate.blockedReasons.qualityModePlanRestriction
    );
  });

  it("maps insufficient_credits to localized message", () => {
    expect(getBlockedReason("insufficient_credits", appMessagesPt)).toBe(
      appMessagesPt.generate.blockedReasons.insufficientCredits
    );
  });

  it("falls back to generic blocked message for unknown codes", () => {
    expect(getBlockedReason("unknown_code", appMessagesPt)).toBe(appMessagesPt.generate.blocked);
    expect(getBlockedReason(undefined, appMessagesEn)).toBe(appMessagesEn.generate.blocked);
  });
});

describe("isQualityModeAllowedForUser", () => {
  const qualityModeOptions = [
    { id: "fast" as QualityMode, allowed: true, recommended: false },
    { id: "balanced" as QualityMode, allowed: false, recommended: true, blockedReason: "quality_mode_plan_restriction" },
    { id: "strict" as QualityMode, allowed: false, recommended: false }
  ];

  it("uses preview option allowed flag when present", () => {
    expect(isQualityModeAllowedForUser("fast", qualityModeOptions, ["fast", "balanced"])).toBe(true);
    expect(isQualityModeAllowedForUser("balanced", qualityModeOptions, ["fast", "balanced", "strict"])).toBe(false);
  });

  it("falls back to catalog allowed modes when preview option is missing", () => {
    expect(isQualityModeAllowedForUser("strict", [], ["strict"])).toBe(true);
    expect(isQualityModeAllowedForUser("strict", [], undefined)).toBe(false);
  });
});
