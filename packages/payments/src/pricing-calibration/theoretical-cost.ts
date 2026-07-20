import type { QualityMode } from "@my-ai-orchestrator/contracts";

// Custo de COGS por geração em USD, derivado das tarifas reais de tabela do modelo que a
// policy ativa roteia (gemini-3.1-flash-lite, $0.25/$1.50 por 1M) × chamadas por modo
// (1/2/3 lanes) × tokens por tipo de conteúdo. Só vale como estimativa até haver telemetria
// observada — buildCellStats prefere o observado sempre que existir.
//
// Os valores anteriores (fast 0.03 → strict 1.20) vinham de uma taxa blended de $4/$15 por
// 1M, preço de modelo classe frontier, e inflavam o custo em ~12x. Toda a calibração de
// preço construída em cima deles subestimava a margem na mesma proporção.
const THEORETICAL_COST_USD: Record<string, Record<QualityMode, number>> = {
  "twitter-thread": { fast: 0.0026, balanced: 0.0052, strict: 0.0078 },
  "linkedin-post": { fast: 0.0027, balanced: 0.0054, strict: 0.0082 },
  "validation-post": { fast: 0.003, balanced: 0.006, strict: 0.009 },
  newsletter: { fast: 0.0052, balanced: 0.0103, strict: 0.0155 },
  "long-form-blog": { fast: 0.0117, balanced: 0.0234, strict: 0.0351 },
  "architecture-post": { fast: 0.0099, balanced: 0.0198, strict: 0.0298 }
};

export const CALIBRATION_CONTENT_TYPES = [
  "twitter-thread",
  "linkedin-post",
  "validation-post",
  "newsletter",
  "long-form-blog",
  "architecture-post"
] as const;

export const CALIBRATION_QUALITY_MODES: readonly QualityMode[] = ["fast", "balanced", "strict"];

export const CALIBRATION_PLAN_TIERS = ["free", "starter", "pro", "enterprise"] as const;

export function estimateTheoreticalCostUsd(input: {
  readonly contentType: string;
  readonly qualityMode: QualityMode;
}): number {
  const row = THEORETICAL_COST_USD[input.contentType] ?? THEORETICAL_COST_USD["validation-post"];
  return row[input.qualityMode];
}
