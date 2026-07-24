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

function scriptedAdapter(texts: readonly string[]): {
  adapter: AIAdapterServiceContract;
  calls: () => number;
  prompts: () => readonly { system: string; user: string }[];
} {
  let i = 0;
  const captured: { system: string; user: string }[] = [];
  const adapter: AIAdapterServiceContract = {
    complete: (call) =>
      Effect.sync(() => {
        const text = texts[Math.min(i, texts.length - 1)] ?? "";
        i += 1;
        const messages = call.request.messages as readonly { role: string; content: string }[];
        captured.push({
          system: messages.find((m) => m.role === "system")?.content ?? "",
          user: messages.find((m) => m.role === "user")?.content ?? ""
        });
        return {
          request: call.request,
          providerRequest: {} as never,
          response: { provider: call.request.provider, model: call.request.model, text }
        };
      })
  };
  return { adapter, calls: () => i, prompts: () => captured };
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

// The reported bug: an author whose Practice Profile is one field (here marketing) writes about an
// off-field, reflective theme. Pre-fix the specificity gate + "anchor in the profile's own named terms"
// retry dragged the profile's backbone into the questions (funnels/HubSpot, or in the tech report p99 /
// e-commerce peaks). The corrected questions are ABOUT the theme and name no proper noun/number — the
// concrete case belongs in the author's answer — so under the eliciting gate they pass on first attempt.
const DIVERGENT_THEME =
  "Em um mundo em que tudo ao seu redor é gerado por IA, manter-se autêntico será sempre o maior objetivo";

const ON_THEME_THIN_SLOTS = {
  payload:
    "Qual é a ideia central que você quer que o leitor leve sobre se manter autêntico num mundo em que tudo é gerado por máquinas?",
  anchor:
    "Que experiência sua com autenticidade, no seu próprio trabalho, seria o exemplo mais forte aqui?",
  resistance:
    "Qual é o outro lado honesto — quando buscar autenticidade a todo custo atrapalha em vez de ajudar?",
  stake: "Por que esse leitor deveria se importar com isso agora, e não depois?"
};
const ON_THEME_THIN_PAYLOAD = JSON.stringify({ slots: ON_THEME_THIN_SLOTS });

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

  // Post-fix the filler gate is per slot: one dead-filler phrase among four clean questions still
  // triggers the retry. (A merely-thin slot no longer does — see the divergent-theme guard below: a
  // question that names no case is correct, because the specific belongs in the author's answer.)
  it("retries when a single slot carries a dead filler phrase (partial genericity)", async () => {
    const partiallyFiller = JSON.stringify({
      slots: { ...SPECIFIC_SLOTS, stake: "Por que isso importa? Pense em agregar valor pra ele agora." }
    });
    const { adapter, calls } = scriptedAdapter([partiallyFiller, SPECIFIC_SLOTS_PAYLOAD]);
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
    expect(slots[3]?.question).toBe(SPECIFIC_SLOTS.stake);
  });

  // Core regression guard for the reported bug: an off-field, reflective theme written by an author
  // whose profile is another field. The eliciting questions name no proper noun/number and stay ABOUT
  // the theme, so they must pass on the FIRST attempt — never retried into the author's usual subject.
  it("accepts on-theme questions that name no specific for a divergent theme, on the first attempt", async () => {
    const { adapter, calls } = scriptedAdapter([ON_THEME_THIN_PAYLOAD]);
    const slots = await Effect.runPromise(
      generateGenerationSlots({
        profile: MARKETING_PROFILE,
        theme: DIVERGENT_THEME,
        narrowedAudience: NARROWED_AUDIENCE,
        locale: "pt-BR",
        deps: depsFor(adapter)
      })
    );

    expect(calls()).toBe(1);
    expect(slots[0]?.question).toBe(ON_THEME_THIN_SLOTS.payload);
    expect(slots[3]?.question).toBe(ON_THEME_THIN_SLOTS.stake);
  });

  // The drift guard on the prompt itself: the theme must be the SUBJECT of every question and the
  // profile only a shaping lens, and the model must be told to elicit rather than presuppose — otherwise
  // an off-field theme gets rewritten into the profile's backbone (the p99/e-commerce questions reported).
  it("puts the theme as the subject and instructs the model to elicit, not presuppose", async () => {
    const { adapter, prompts } = scriptedAdapter([ON_THEME_THIN_PAYLOAD]);
    await Effect.runPromise(
      generateGenerationSlots({
        profile: MARKETING_PROFILE,
        theme: DIVERGENT_THEME,
        narrowedAudience: NARROWED_AUDIENCE,
        locale: "pt-BR",
        deps: depsFor(adapter)
      })
    );

    const sent = prompts()[0];
    const combined = `${sent.system}\n${sent.user}`;
    expect(combined).toMatch(/subject of all 4 questions/i);
    expect(combined).toContain(DIVERGENT_THEME);
    expect(combined).toMatch(/ELICITS the author's own take/i);
    expect(combined).toMatch(/never reframe or narrow the theme onto the author's usual subject/i);
    expect(combined).toMatch(/belongs in the author's ANSWER/i);
  });

  // Guard for the rigidity/"engessamento" report: the questions parroted the profile's own wording
  // (automação, resiliência da arquitetura) and collapsed to one template ("provocação central sobre…")
  // regardless of the theme. The prompt must word each question in the THEME'S words, use the profile
  // only to pick the KIND (never its vocabulary), and vary the phrasing across themes.
  it("words questions in the theme's own terms and forbids importing the profile's vocabulary or a fixed template", async () => {
    const { adapter, prompts } = scriptedAdapter([ON_THEME_THIN_PAYLOAD]);
    await Effect.runPromise(
      generateGenerationSlots({
        profile: MARKETING_PROFILE,
        theme: DIVERGENT_THEME,
        narrowedAudience: NARROWED_AUDIENCE,
        locale: "pt-BR",
        deps: depsFor(adapter)
      })
    );

    const combined = `${prompts()[0].system}\n${prompts()[0].user}`;
    // The wording comes from the theme, not the profile.
    expect(combined).toMatch(/worded in the THEME'S OWN words/i);
    expect(combined).toMatch(/the question's words come from the theme/i);
    // The profile decides the KIND + register only; its vocabulary must not surface.
    expect(combined).toMatch(/decide the KIND of question and its register/i);
    expect(combined).toMatch(/never import the profile's own vocabulary/i);
    // No single template across themes.
    expect(combined).toMatch(/vary the phrasing/i);
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
