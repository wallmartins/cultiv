import { describe, expect, it } from "vitest";
import type { VoiceExampleRecord } from "@my-ai-orchestrator/database";
import { resolveRules } from "../src/product/voice/voice-rebuild-derivation-resolvers.js";

function examples(texts: readonly string[]): VoiceExampleRecord[] {
  return texts.map((text) => ({ text, state: "active" }) as unknown as VoiceExampleRecord);
}

const PERSPECTIVE_RULES = ["prefer_first_person_when_relevant", "prefer_third_person_perspective"];

function perspectiveOf(texts: readonly string[]): string | undefined {
  return resolveRules(examples(texts), "high").find((rule) => PERSPECTIVE_RULES.includes(rule));
}

// Excerpts from a real author's wizard answers — he narrates his own decisions, mostly through
// verb morphology ("iniciei", "Busquei", "estruturei") rather than pronouns.
const FIRST_PERSON_AUTHOR = [
  "Microsserviços e arquitetura distribuída. Desenvolver uma arquitetura distribuída é um tiro no pé para o momento do projeto. Crie um monolito modular bem separadinho.",
  "Em muitos momentos, eu tinha um preciosismo com performance e clean architecture. Então iniciei uma migração completa do ecossistema frontend para criar uma biblioteca apartada.",
  "Em uma fintech que eu trabalhei, estávamos com alta demanda no suporte. Busquei uma solução mais pragmática e encontrei a Amazon Lex. Sendo assim, estruturei uma apresentação com os prós e os contras.",
  "Imagina que o seu carro não tem painel. Enquanto você anda, você precisa prestar atenção em cada barulho. Essa é a importância da observabilidade."
];

const THIRD_PERSON_AUTHOR = [
  "O gestor que não escreve deixa a decisão no ar. Ele fala numa reunião, ela some na semana seguinte, e o time inteiro paga por isso depois.",
  "O engenheiro sênior mede antes de mexer. Ele já perdeu semanas otimizando o lugar errado, e aprendeu que a intuição dele mente sobre onde está o gargalo.",
  "O usuário sente a variância, não a média. Ele não percebe os 50ms bons, mas lembra do travamento de quatro segundos, e é isso que ele conta pros outros.",
  "O leitor abre o livro pelo sumário. Ele não folheia página por página, ele pula direto pro capítulo, e por isso ela precisa manter o índice atualizado."
];

describe("perspective rule", () => {
  it("instructs first person for an author who writes in it", () => {
    expect(perspectiveOf(FIRST_PERSON_AUTHOR)).toBe("prefer_first_person_when_relevant");
  });

  // Documents a known gap rather than asserting desired behaviour: a settled third-person voice
  // gets no perspective instruction, so generation falls back to the model's default. Pronoun
  // density was measured as a fix and rejected — on the first-person author above it reads 0.0084
  // vs 0.0060, a 1.4x dominance, because pt-BR is pro-drop and "ele"/"dele" attach to objects.
  // Whoever closes this should look at first-person verb morphology, against several authors.
  it("has no third-person counterpart yet", () => {
    expect(perspectiveOf(THIRD_PERSON_AUTHOR)).toBeUndefined();
  });
});
