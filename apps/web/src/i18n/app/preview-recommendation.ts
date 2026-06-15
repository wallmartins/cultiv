import type { GenerationPreviewRecommendation, QualityMode } from "@my-ai-orchestrator/contracts";
import type { AppLocale } from "./types";

export function getPreviewRecommendationExplanation(
  locale: AppLocale,
  recommendation: GenerationPreviewRecommendation,
  qualityModeLabels: Record<QualityMode, string>
): string {
  const modeLabel = qualityModeLabels[recommendation.qualityMode];

  if (recommendation.reasonCodes.includes("allowed_option_guard")) {
    if (locale === "en") {
      return `${modeLabel} is recommended because it best fits this request within your currently available options.`;
    }

    return `${modeLabel} é recomendado porque se encaixa melhor neste pedido dentro das opções disponíveis para você.`;
  }

  if (recommendation.qualityMode === "strict") {
    return locale === "en"
      ? "Strict is recommended for a more complex request with richer context to preserve."
      : "Afinado é recomendado para pedidos mais complexos, com contexto mais rico para preservar.";
  }

  if (recommendation.qualityMode === "fast") {
    return locale === "en"
      ? "Fast is recommended for a shorter request with lower structural complexity."
      : "Direto é recomendado para pedidos mais curtos e com menor complexidade estrutural.";
  }

  return locale === "en"
    ? "Balanced is recommended because this request benefits from structure without needing the highest-cost mode."
    : "Equilibrado é recomendado porque este pedido se beneficia de estrutura sem precisar do modo de maior custo.";
}
