import type {
  ExecutionStatusView,
  ExecutionVoiceMetadataView,
  GenerationChannel,
  GenerationLengthTier
} from "@my-ai-orchestrator/contracts";
import { confidenceRingValue } from "@my-ai-orchestrator/shared";
import type { ExecutionDetailAlignment } from "@my-ai-orchestrator/ui/app/detail";

// Same label maps as shell/history-view.ts (rail item), duplicated rather than imported — that
// file is owned by S2 (shell) and off-limits here; both readings are small and pure.
const LENGTH_LABEL: Record<GenerationLengthTier, string> = { short: "Curto", medium: "Médio", long: "Longo" };
const CHANNEL_LABEL: Partial<Record<GenerationChannel, string>> = {
  "professional-network": "LinkedIn",
  blog: "Blog",
  email: "Newsletter",
  social: "X"
};

function formatRelativeTime(createdAt: string, now: Date): string {
  const created = new Date(createdAt);
  const minutes = Math.max(0, Math.round((now.getTime() - created.getTime()) / 60_000));
  if (minutes < 60) return minutes <= 1 ? "agora" : `há ${minutes} min`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `há ${hours} h`;
  const days = Math.round(hours / 24);
  return days === 1 ? "ontem" : `há ${days} dias`;
}

// "[tamanho] · [canal|Texto livre] · [tempo relativo] · voz vN" (breakdown-09 §1b DetailMeta).
export function buildDetailMeta(execution: ExecutionStatusView, now: Date): string {
  const parts: string[] = [];
  if (execution.lengthTier) parts.push(LENGTH_LABEL[execution.lengthTier]);
  parts.push((execution.channel && CHANNEL_LABEL[execution.channel]) || "Texto livre");
  parts.push(formatRelativeTime(execution.createdAt, now));
  if (execution.voice) parts.push(`voz v${execution.voice.voiceProfileVersionUsed}`);
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

export function formatElapsed(createdAt: string, now: Date): string {
  const minutes = Math.max(0, Math.round((now.getTime() - new Date(createdAt).getTime()) / 60_000));
  if (minutes < 1) return "agora";
  if (minutes < 60) return `há ${minutes} min`;
  return `há ${Math.round(minutes / 60)} h`;
}

export function buildAlignment(voice: ExecutionVoiceMetadataView | undefined): ExecutionDetailAlignment {
  if (!voice) return { confidenceValue: 0, traits: [], rules: [], antiPatterns: [] };
  return {
    confidenceValue: confidenceRingValue(voice.voiceProfileConfidence),
    traits: voice.appliedSignals.styleMarkers,
    rules: voice.appliedSignals.rules,
    antiPatterns: voice.appliedSignals.antiPatterns
  };
}

// O SDK falha com ClientSdkHttpStatusError, que carrega `status`. Traduz os casos que o autor
// pode resolver sozinho; o resto cai no genérico.
export function detailErrorReason(error: unknown): string {
  const status = typeof error === "object" && error !== null ? (error as { status?: unknown }).status : undefined;
  if (status === 404) return "essa geração não existe mais";
  if (status === 401 || status === 403) return "sua sessão expirou — entre de novo";
  return "não deu para carregar essa geração";
}
