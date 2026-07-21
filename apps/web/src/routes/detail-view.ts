import type { ExecutionStatusView, ExecutionVoiceMetadataView } from "@my-ai-orchestrator/contracts";
import { confidenceRingValue } from "@my-ai-orchestrator/shared";
import type { ExecutionDetailAlignment } from "@my-ai-orchestrator/ui/app/detail";
import { voiceSignalLabel, type AppFormatters, type AppMessages } from "@my-ai-orchestrator/ui/app/i18n";

// "[tamanho] · [canal|Texto livre] · [tempo relativo] · voz vN" (breakdown-09 §1b DetailMeta).
export function buildDetailMeta(
  t: AppMessages,
  format: AppFormatters,
  execution: ExecutionStatusView,
  now: Date
): string {
  const parts: string[] = [];
  if (execution.lengthTier) parts.push(t.common.length[execution.lengthTier]);
  parts.push(
    (execution.channel && t.common.channel[execution.channel as keyof typeof t.common.channel]) || t.common.freeText
  );
  parts.push(format.relativeTime(execution.createdAt, now));
  if (execution.voice) parts.push(t.detail.voiceVersion(execution.voice.voiceProfileVersionUsed));
  return parts.join(" · ");
}

// The generated text arrives as one string — the reader renders it as paragraphs, splitting on
// blank lines first (the common case) and falling back to single line breaks.
export function splitParagraphs(content: string): readonly string[] {
  const byBlankLine = content
    .split(/\n{2,}/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean);
  if (byBlankLine.length > 1) return byBlankLine;

  const byLine = content
    .split(/\n+/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean);
  return byLine.length > 0 ? byLine : [content.trim()];
}

// 1b — the live view swaps to LongTimeoutWatch once the watch passes 2 min (breakdown-15 §1).
const LONG_TIMEOUT_MS = 2 * 60_000;

export function isLongRunning(createdAt: string, now: Date): boolean {
  return now.getTime() - new Date(createdAt).getTime() >= LONG_TIMEOUT_MS;
}

export function buildAlignment(
  t: AppMessages,
  voice: ExecutionVoiceMetadataView | undefined
): ExecutionDetailAlignment {
  if (!voice) return { confidenceValue: 0, traits: [], rules: [], antiPatterns: [] };
  const label = (value: string) => voiceSignalLabel(t, value);
  return {
    confidenceValue: confidenceRingValue(voice.voiceProfileConfidence),
    traits: voice.appliedSignals.styleMarkers.map(label),
    rules: voice.appliedSignals.rules.map(label),
    antiPatterns: voice.appliedSignals.antiPatterns.map(label)
  };
}

// O SDK falha com ClientSdkHttpStatusError, que carrega `status`. Traduz os casos que o autor
// pode resolver sozinho; o resto cai no genérico.
export function detailErrorReason(t: AppMessages, error: unknown): string {
  const status = typeof error === "object" && error !== null ? (error as { status?: unknown }).status : undefined;
  if (status === 404) return t.detail.error.notFound;
  if (status === 401 || status === 403) return t.detail.error.sessionExpired;
  return t.detail.error.generic;
}
