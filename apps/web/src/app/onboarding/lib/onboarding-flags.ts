const ONBOARDING_COMPLETE_KEY = "cultiv.onboarding.completed";
const VOICE_SKIPPED_KEY = "cultiv.onboarding.voiceSkipped";

function scopedKey(baseKey: string, userId: string): string {
  return `${baseKey}:${userId}`;
}

export function isOnboardingComplete(userId: string | undefined): boolean {
  if (!userId || typeof window === "undefined") {
    return false;
  }

  return window.localStorage.getItem(scopedKey(ONBOARDING_COMPLETE_KEY, userId)) === "true";
}

export function markOnboardingComplete(userId: string): void {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(scopedKey(ONBOARDING_COMPLETE_KEY, userId), "true");
}

export function isVoiceStepSkipped(userId: string | undefined): boolean {
  if (!userId || typeof window === "undefined") {
    return false;
  }

  return window.localStorage.getItem(scopedKey(VOICE_SKIPPED_KEY, userId)) === "true";
}

export function markVoiceStepSkipped(userId: string): void {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(scopedKey(VOICE_SKIPPED_KEY, userId), "true");
}
