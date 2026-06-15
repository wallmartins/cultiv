export {
  isOnboardingComplete,
  markOnboardingComplete
} from "../../onboarding/lib/onboarding-flags.js";

export function clearOnboardingComplete(userId: string): void {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.removeItem(`cultiv.onboarding.completed:${userId}`);
}
