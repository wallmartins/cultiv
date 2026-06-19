import type { GeneratePrefill } from "@my-ai-orchestrator/contracts";
import {
  decodeGeneratePrefill,
  mapLegacyContentTypeToPhase1Intent,
  resolvePhase1LegacyContentTypeId
} from "@my-ai-orchestrator/contracts";
import { Effect } from "effect";

const PREFILL_KEY = "cultiv.generate.prefill";

export type { GeneratePrefill };

export function resolveLegacyContentTypeId(
  intent: Parameters<typeof resolvePhase1LegacyContentTypeId>[0],
  lengthTier: Parameters<typeof resolvePhase1LegacyContentTypeId>[1]
): string {
  return resolvePhase1LegacyContentTypeId(intent, lengthTier);
}

export function mapLegacyContentTypeToIntent(
  contentType: string
): ReturnType<typeof mapLegacyContentTypeToPhase1Intent> {
  return mapLegacyContentTypeToPhase1Intent(contentType);
}

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
    const decoded = Effect.runSync(Effect.either(decodeGeneratePrefill(JSON.parse(raw))));
    return decoded._tag === "Right" ? decoded.right : null;
  } catch {
    return null;
  }
}
