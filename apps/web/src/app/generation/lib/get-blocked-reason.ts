import type { AppMessages } from "~/i18n/app/types";

export function getBlockedReason(
  reasonCode: string | undefined,
  messages: AppMessages
): string {
  if (reasonCode === "plan_restriction") {
    return messages.generate.blockedReasons.planRestriction;
  }

  if (reasonCode === "feature_flag_disabled") {
    return messages.generate.blockedReasons.featureFlagDisabled;
  }

  if (reasonCode === "subscription_inactive") {
    return messages.generate.blockedReasons.subscriptionInactive;
  }

  if (reasonCode === "quality_mode_plan_restriction") {
    return messages.generate.blockedReasons.qualityModePlanRestriction;
  }

  if (reasonCode === "insufficient_credits") {
    return messages.generate.blockedReasons.insufficientCredits;
  }

  return messages.generate.blocked;
}
