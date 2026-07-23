import type { PlanSignature, QualityMode } from "@my-ai-orchestrator/contracts";

// Custo de COGS por geração em USD, derivado das tarifas reais de tabela do modelo que a
// policy ativa roteia (gemini-3.1-flash-lite, $0.25/$1.50 por 1M) × chamadas por modo
// (1/2/3 lanes) × tokens por bucket de plan signature. Só vale como estimativa até haver
// telemetria observada — buildCellStats prefere o observado sempre que existir.
//
// Os valores anteriores (fast 0.03 → strict 1.20) vinham de uma taxa blended de $4/$15 por
// 1M, preço de modelo classe frontier, e inflavam o custo em ~12x. Toda a calibração de
// preço construída em cima deles subestimava a margem na mesma proporção.
//
// Re-chaveado dos 6 content types legados para os 4 plan signatures do compositor:
// short-piece = média(twitter-thread, linkedin-post); long-piece = média(long-form-blog,
// architecture-post); serial-piece = validation-post (sucessor 1:1); edition-piece =
// newsletter (sucessor 1:1).
const THEORETICAL_COST_USD: Record<PlanSignature, Record<QualityMode, number>> = {
  "short-piece": { fast: 0.0027, balanced: 0.0053, strict: 0.008 },
  "long-piece": { fast: 0.0108, balanced: 0.0216, strict: 0.0325 },
  "serial-piece": { fast: 0.003, balanced: 0.006, strict: 0.009 },
  "edition-piece": { fast: 0.0052, balanced: 0.0103, strict: 0.0155 }
};

export const CALIBRATION_CONTENT_TYPES = [
  "short-piece",
  "long-piece",
  "serial-piece",
  "edition-piece"
] as const satisfies readonly PlanSignature[];

export const CALIBRATION_QUALITY_MODES: readonly QualityMode[] = ["fast", "balanced", "strict"];

export const CALIBRATION_PLAN_TIERS = ["free", "starter", "pro", "enterprise"] as const;

export function estimateTheoreticalCostUsd(input: {
  readonly contentType: string;
  readonly qualityMode: QualityMode;
}): number {
  const row = THEORETICAL_COST_USD[input.contentType as PlanSignature] ?? THEORETICAL_COST_USD["serial-piece"];
  return row[input.qualityMode];
}
