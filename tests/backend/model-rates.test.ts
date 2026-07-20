import { describe, expect, it } from "vitest";
import {
  estimateUsdCost,
  isKnownModelRate,
  resolveModelRate
} from "../../apps/backend/src/execution/cost/model-rates.js";

describe("custo por modelo (USD)", () => {
  it("cobre todo modelo que a policy ativa pode rotear", () => {
    // Se um routingProfile passar a apontar para um modelo fora da tabela, o custo cai no
    // teto conservador e a recalibração de preço fica distorcida — por isso o teste falha aqui.
    for (const [provider, model] of [
      ["gemini", "gemini-3.1-flash-lite"],
      ["gemini", "gemini-2.5-flash"],
      ["groq", "llama-3.3-70b-versatile"]
    ] as const) {
      expect(isKnownModelRate(provider, model), `${provider}:${model} sem tarifa`).toBe(true);
    }
  });

  it("calcula o custo real do flash-lite a partir da tarifa de tabela", () => {
    // 10k in / 2k out => 10000 * 0.25/1e6 + 2000 * 1.50/1e6 = 0.0025 + 0.003
    expect(
      estimateUsdCost({
        provider: "gemini",
        model: "gemini-3.1-flash-lite",
        inputTokens: 10_000,
        outputTokens: 2_000
      })
    ).toBeCloseTo(0.0055, 6);
  });

  it("mantém precisão em chamadas baratas em vez de arredondar para zero", () => {
    const cost = estimateUsdCost({
      provider: "gemini",
      model: "gemini-3.1-flash-lite",
      inputTokens: 500,
      outputTokens: 100
    });

    expect(cost).toBeGreaterThan(0);
    expect(cost).toBeCloseTo(0.000275, 6);
  });

  it("superestima modelo desconhecido em vez de subestimar", () => {
    const unknown = estimateUsdCost({
      provider: "openai",
      model: "modelo-que-nao-existe",
      inputTokens: 10_000,
      outputTokens: 2_000
    });
    const known = estimateUsdCost({
      provider: "gemini",
      model: "gemini-3.1-flash-lite",
      inputTokens: 10_000,
      outputTokens: 2_000
    });

    expect(unknown).toBeGreaterThan(known);
  });

  it("resolve a tarifa sem depender de caixa", () => {
    expect(resolveModelRate("GEMINI", "Gemini-3.1-Flash-Lite")).toEqual(
      resolveModelRate("gemini", "gemini-3.1-flash-lite")
    );
  });

  // Regressão do bug de origem: a taxa blended antiga ($4/$15 por 1M, sem rótulo de moeda
  // nem modelo) inflava o COGS em ~12x e foi a base de toda a calibração de preço anterior.
  it("não volta para a taxa blended de $4/$15 por 1M", () => {
    const real = estimateUsdCost({
      provider: "gemini",
      model: "gemini-3.1-flash-lite",
      inputTokens: 10_000,
      outputTokens: 2_000
    });
    const blendedAntigo = 10_000 * 0.000004 + 2_000 * 0.000015;

    expect(blendedAntigo / real).toBeGreaterThan(10);
  });
});
