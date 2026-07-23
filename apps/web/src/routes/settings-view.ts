import type { GenerationChannel, VoiceTrainingConsentStatusView } from "@my-ai-orchestrator/contracts";
import type { AppFormatters, AppMessages } from "@my-ai-orchestrator/ui/app/i18n";

// Mirrors WorkspaceShellContainer's local initialsFrom (apps/web/src/shell/, not exported/owned
// by S9) — small enough that duplicating beats reaching into another surface's file.
export function initialsFrom(name: string | undefined, email: string | undefined): string {
  const source = name?.trim() || email?.trim();
  if (!source) return "?";
  const parts = source.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return source.slice(0, 2).toUpperCase();
}

// "concedido em {data}" mirror copy (design linha 1464) — a different prefix from voice-mappers'
// buildConsentSinceLabel ("desde {data}"), so this stays a local formatter rather than importing
// that S5-owned string.
export function consentMirrorSinceLabel(t: AppMessages, format: AppFormatters, consent: VoiceTrainingConsentStatusView): string {
  const since = consent.granted ? consent.grantedAt : consent.revokedAt;
  return since ? t.settings.consentSinceLabel(format.date(since)) : "";
}

// 1e (GAP #7) — no per-user "audience" field survives a reset. The most recent execution's real
// channel is the closest honest proxy available at reset time; unknown/no-channel falls back to
// a generic, non-invented phrase.
export function audienceFromChannel(t: AppMessages, channel: GenerationChannel | undefined | null): string {
  const label = channel ? t.settings.channelAudienceLabel[channel] : undefined;
  return label ?? t.settings.channelAudienceFallback;
}
