import type { GenerationChannel, VoiceTrainingConsentStatusView } from "@my-ai-orchestrator/contracts";

// Mirrors WorkspaceShellContainer's local initialsFrom (apps/web/src/shell/, not exported/owned
// by S9) — small enough that duplicating beats reaching into another surface's file.
export function initialsFrom(name: string | undefined, email: string | undefined): string {
  const source = name?.trim() || email?.trim();
  if (!source) return "?";
  const parts = source.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return source.slice(0, 2).toUpperCase();
}

// UTC getters (mirrors billing-view.ts's formatDayMonth) — local getters would shift the date
// near midnight depending on the runner's timezone.
function formatFullDate(iso: string): string {
  const date = new Date(iso);
  return `${String(date.getUTCDate()).padStart(2, "0")}/${String(date.getUTCMonth() + 1).padStart(2, "0")}/${date.getUTCFullYear()}`;
}

// "concedido em {data}" mirror copy (design linha 1464) — a different prefix from voice-mappers'
// buildConsentSinceLabel ("desde {data}"), so this stays a local formatter rather than importing
// that S5-owned string.
export function consentMirrorSinceLabel(consent: VoiceTrainingConsentStatusView): string {
  const since = consent.granted ? consent.grantedAt : consent.revokedAt;
  return since ? `em ${formatFullDate(since)}` : "";
}

// 1e (GAP #7) — no per-user "audience" field survives a reset. The most recent execution's real
// channel is the closest honest proxy available at reset time; unknown/no-channel falls back to
// a generic, non-invented phrase.
const CHANNEL_AUDIENCE_LABEL: Partial<Record<GenerationChannel, string>> = {
  "professional-network": "quem te lê no LinkedIn",
  blog: "quem acompanha o seu blog",
  email: "quem assina sua newsletter",
  social: "quem te segue"
};

export function audienceFromChannel(channel: GenerationChannel | undefined | null): string {
  return (channel && CHANNEL_AUDIENCE_LABEL[channel]) || "quem te acompanha";
}
