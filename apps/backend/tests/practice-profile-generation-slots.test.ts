import { Effect } from "effect";
import { describe, expect, it } from "vitest";
import type { AIAdapterServiceContract } from "@my-ai-orchestrator/ai-adapters";
import { AIAdapterTransportError } from "@my-ai-orchestrator/ai-adapters";
import type { PracticeProfile } from "@my-ai-orchestrator/contracts";
import type { BackendProviderTransport } from "../src/execution/pipeline/provider-transport.js";
import type { PracticeProfileGenerationDeps } from "../src/product/practice-profile/practice-profile-generation-core.js";
import {
  backboneGenerationSlots,
  generateGenerationSlots
} from "../src/product/practice-profile/practice-profile-generation-slots.js";

const NOOP_TRANSPORT = { complete: () => Effect.succeed(undefined) } as unknown as BackendProviderTransport;
const ATTEMPT = { provider: "gemini", model: "gemini-3.1-flash-lite", timeoutMs: 20000 };

function scriptedAdapter(texts: readonly string[]): { adapter: AIAdapterServiceContract; calls: () => number } {
  let i = 0;
  const adapter: AIAdapterServiceContract = {
    complete: (call) =>
      Effect.sync(() => {
        const text = texts[Math.min(i, texts.length - 1)] ?? "";
        i += 1;
        return {
          request: call.request,
          providerRequest: {} as never,
          response: { provider: call.request.provider, model: call.request.model, text }
        };
      })
  };
  return { adapter, calls: () => i };
}

function depsFor(adapter: AIAdapterServiceContract): PracticeProfileGenerationDeps {
  return { attempts: [ATTEMPT], aiAdapters: adapter, providerTransport: NOOP_TRANSPORT };
}

// The marketing "promover meu SaaS" gold standard (norte amostras/marketing.md §"Sessão de geração"),
// enriched with named specifics so it also passes the cliché-leak detector on the first pass.
const MARKETING_PROFILE: PracticeProfile = {
  userId: "u1",
  version: 1,
  depth: "enriched",
  subject: "copy e conteúdo",
  vantagePoint: "redatora sênior; trabalha com clientes, vê briefing ruim de perto",
  audiences: ["redatores", "gestores de marketing", "founders"],
  dimensions: {
    point: "ação pretendida + a crença que o leitor precisa ter pra tomá-la — nunca uma tese.",
    evidence: "o que dá pra mostrar em vez de afirmar: antes/depois, número, o produto fazendo a coisa.",
    readerAssumption: "founder-comprador conhece a própria dor mas não por que o produto a resolve.",
    resistance: "a trava de compra: não acredita que funciona, acha caro, ou já tem algo que resolve mal.",
    stake: "por que agir agora vs. depois — por que olhar isso e não esperar três meses.",
    fieldCliche: "engajamento e autenticidade, conte uma história, conteúdo é rei",
    lexicon: ["copy", "CTA", "funil", "conversão", "hook"]
  }
};

const THEME = "promover meu SaaS";
const NARROWED_AUDIENCE = "founders que contratam";

const SPECIFIC_SLOTS = {
  payload:
    'Qual é a ação que você quer que o founder do SaaS tome depois de ler — e o que ele precisa acreditar sobre o produto pra fazer isso?',
  anchor:
    'O que dá pra mostrar em vez de afirmar — um antes/depois, um número como "churn caiu 12%", ou o produto fazendo a coisa?',
  resistance:
    "O que trava esse founder hoje: não acredita que funciona, acha caro perto de uma ferramenta como o HubSpot, ou já tem algo que resolve mal?",
  stake: "Por que ele deveria decidir isso nos próximos 30 dias e não daqui a três meses?"
};

const SPECIFIC_SLOTS_PAYLOAD = JSON.stringify({ slots: SPECIFIC_SLOTS });

const GENERIC_SLOTS_PAYLOAD = JSON.stringify({
  slots: {
    payload: "é importante agregar valor para o leitor.",
    anchor: "mostre um exemplo qualquer que funcione.",
    resistance: "pense na objeção que ele pode ter.",
    stake: "isso importa muito pra ele agora."
  }
});

describe("practice profile generator — G4 generation slots", () => {
  it("assembles the 4 curated slots in order from the LLM payload (marketing gold-standard shape)", async () => {
    const { adapter, calls } = scriptedAdapter([SPECIFIC_SLOTS_PAYLOAD]);
    const slots = await Effect.runPromise(
      generateGenerationSlots({
        profile: MARKETING_PROFILE,
        theme: THEME,
        narrowedAudience: NARROWED_AUDIENCE,
        locale: "pt-BR",
        deps: depsFor(adapter)
      })
    );

    expect(calls()).toBe(1);
    expect(slots.map((slot) => slot.slot)).toEqual(["payload", "anchor", "resistance", "stake"]);
    expect(slots[0]?.question).toBe(SPECIFIC_SLOTS.payload);
    expect(slots[1]?.question).toBe(SPECIFIC_SLOTS.anchor);
    expect(slots[2]?.question).toBe(SPECIFIC_SLOTS.resistance);
    expect(slots[3]?.question).toBe(SPECIFIC_SLOTS.stake);
  });

  it("retries once against the cliché suffix when the first fill reads as generic", async () => {
    const { adapter, calls } = scriptedAdapter([GENERIC_SLOTS_PAYLOAD, SPECIFIC_SLOTS_PAYLOAD]);
    const slots = await Effect.runPromise(
      generateGenerationSlots({
        profile: MARKETING_PROFILE,
        theme: THEME,
        narrowedAudience: NARROWED_AUDIENCE,
        locale: "pt-BR",
        deps: depsFor(adapter)
      })
    );

    expect(calls()).toBe(2);
    expect(slots[0]?.question).toBe(SPECIFIC_SLOTS.payload);
  });

  it("fails with a tagged error when every provider attempt is exhausted", async () => {
    const adapter: AIAdapterServiceContract = {
      complete: () => Effect.fail(new AIAdapterTransportError({ provider: "gemini", message: "timeout" }))
    };
    const exit = await Effect.runPromiseExit(
      generateGenerationSlots({
        profile: MARKETING_PROFILE,
        theme: THEME,
        narrowedAudience: NARROWED_AUDIENCE,
        locale: "pt-BR",
        deps: depsFor(adapter)
      })
    );

    expect(exit._tag).toBe("Failure");
  });
});

describe("practice profile generator — G4 backbone degrade", () => {
  it("returns the current 4-angle backbone in order with non-empty questions", () => {
    const slots = backboneGenerationSlots({ theme: "migração de monólito", locale: "pt-BR" });

    expect(slots.map((slot) => slot.slot)).toEqual(["payload", "anchor", "resistance", "stake"]);
    for (const slot of slots) {
      expect(slot.question.length).toBeGreaterThan(0);
    }
    expect(slots[0]?.question).toContain("migração de monólito");
  });
});
