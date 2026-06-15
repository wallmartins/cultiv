import type { QualityMode } from "@my-ai-orchestrator/contracts";

const PREFILL_KEY = "cultiv.generate.prefill";

export type GeneratePrefill = {
  readonly contentType: string;
  readonly briefing?: Record<string, unknown>;
  readonly language?: string;
  readonly qualityMode?: QualityMode;
  readonly importedContext?: string;
};

export function storeGeneratePrefill(prefill: GeneratePrefill): void {
  if (typeof window === "undefined") {
    return;
  }

  window.sessionStorage.setItem(PREFILL_KEY, JSON.stringify(prefill));
}

export function consumeGeneratePrefill(): GeneratePrefill | null {
  if (typeof window === "undefined") {
    return null;
  }

  const raw = window.sessionStorage.getItem(PREFILL_KEY);
  window.sessionStorage.removeItem(PREFILL_KEY);
  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw) as GeneratePrefill;
  } catch {
    return null;
  }
}
