const VOICE_CONSENT_KEY = "cultiv.voice.consent.granted";

function scopedKey(userId: string): string {
  return `${VOICE_CONSENT_KEY}:${userId}`;
}

export function hasVoiceConsent(userId: string | undefined): boolean {
  if (!userId || typeof window === "undefined") {
    return false;
  }

  return window.localStorage.getItem(scopedKey(userId)) === "true";
}

export function grantVoiceConsent(userId: string): void {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(scopedKey(userId), "true");
}
