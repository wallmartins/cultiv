export interface ModelTokenRate {
  readonly inputUsdPerMillion: number;
  readonly outputUsdPerMillion: number;
}

// Preço de tabela dos provedores em USD por 1M de tokens, verificado em 2026-07-20.
// Fontes: ai.google.dev/gemini-api/docs/pricing e groq.com/pricing.
// Ao apontar um routingProfile do catálogo de policy para um modelo novo, adicione a
// linha aqui — modelo ausente cai no teto conservador abaixo e é marcado na telemetria,
// para que custo subestimado nunca entre silenciosamente na recalibração de preço.
const MODEL_RATES: Record<string, ModelTokenRate> = {
  "gemini:gemini-3.1-flash-lite": { inputUsdPerMillion: 0.25, outputUsdPerMillion: 1.5 },
  "gemini:gemini-2.5-flash": { inputUsdPerMillion: 0.3, outputUsdPerMillion: 2.5 },
  "gemini:gemini-3.1-pro": { inputUsdPerMillion: 2, outputUsdPerMillion: 12 },
  "gemini:gemini-2.5-pro": { inputUsdPerMillion: 1.25, outputUsdPerMillion: 10 },
  "groq:llama-3.3-70b-versatile": { inputUsdPerMillion: 0.59, outputUsdPerMillion: 0.79 }
};

// Teto deliberado (preço de modelo frontier), não uma média: um modelo desconhecido deve
// superestimar o custo, nunca subestimar.
const UNKNOWN_MODEL_RATE: ModelTokenRate = { inputUsdPerMillion: 2, outputUsdPerMillion: 12 };

function rateKey(provider: string, model: string): string {
  return `${provider.trim().toLowerCase()}:${model.trim().toLowerCase()}`;
}

export function isKnownModelRate(provider: string, model: string): boolean {
  return rateKey(provider, model) in MODEL_RATES;
}

export function resolveModelRate(provider: string, model: string): ModelTokenRate {
  return MODEL_RATES[rateKey(provider, model)] ?? UNKNOWN_MODEL_RATE;
}

export function estimateUsdCost(args: {
  readonly provider: string;
  readonly model: string;
  readonly inputTokens: number;
  readonly outputTokens: number;
}): number {
  const rate = resolveModelRate(args.provider, args.model);
  const cost =
    (Math.max(0, args.inputTokens) * rate.inputUsdPerMillion +
      Math.max(0, args.outputTokens) * rate.outputUsdPerMillion) /
    1_000_000;

  return roundUsd(cost);
}

// 6 casas: uma chamada barata custa ~$0.0003, então arredondar a 4 casas (como antes)
// colapsaria passos individuais para zero e enviesaria a recalibração para baixo.
export function roundUsd(value: number): number {
  return Math.round(value * 1_000_000) / 1_000_000;
}
