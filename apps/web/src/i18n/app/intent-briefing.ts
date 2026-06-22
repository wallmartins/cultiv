import type { BriefingGuidanceView, GenerationIntent } from "@my-ai-orchestrator/contracts";
import type { AppLocale } from "./types";

type BriefingGuidanceCopy = {
  readonly objective: string;
  readonly tips: readonly string[];
  readonly commonMistakes: readonly string[];
};

const ptGuidance: Record<GenerationIntent, BriefingGuidanceCopy> = {
  "share-idea": {
    objective: "Gerar uma publicação concisa com opinião clara.",
    tips: [
      "Use uma ideia concreta.",
      "Abra com um gancho direto.",
      "Mantenha o briefing focado."
    ],
    commonMistakes: ["Ser amplo demais.", "Deixar o público indefinido."]
  },
  "explain-deeply": {
    objective: "Montar um briefing de artigo longo com tese e estrutura.",
    tips: [
      "Defina a tese cedo.",
      "Mantenha a estrutura acionável.",
      "Inclua público e profundidade desejada."
    ],
    commonMistakes: ["Criar uma estrutura vaga, sem opinião."]
  },
  "engage-audience": {
    objective: "Gerar um post que provoca reação, discussão ou engajamento.",
    tips: [
      "Deixe a hipótese explícita.",
      "Inclua uma pergunta quando quiser resposta dos leitores.",
      "Use evidências que convidem ao debate."
    ],
    commonMistakes: ["Soar como um anúncio genérico em vez de um convite para reagir."]
  },
  "tell-story": {
    objective: "Gerar uma sequência curta com gancho forte e fluxo enxuto.",
    tips: [
      "Comece com tensão ou curiosidade.",
      "Mantenha cada bloco focado.",
      "Termine com uma conclusão clara."
    ],
    commonMistakes: ["Tentar colocar ideias demais em uma única sequência."]
  },
  "update-subscribers": {
    objective: "Montar um briefing de newsletter com estrutura e valor para o leitor.",
    tips: [
      "Defina o público.",
      "Deixe o benefício claro desde o início.",
      "Sugira um fluxo de seções."
    ],
    commonMistakes: ["Sobrecarregar o briefing com temas não relacionados."]
  },
  "document-decision": {
    objective: "Gerar um post que explica uma decisão técnica de arquitetura.",
    tips: [
      "Dê contexto suficiente para entender o sistema.",
      "Destaque as restrições.",
      "Deixe os trade-offs explícitos."
    ],
    commonMistakes: ["Focar em detalhes de implementação antes da escolha de design."]
  }
};

const enGuidance: Record<GenerationIntent, BriefingGuidanceCopy> = {
  "share-idea": {
    objective: "Generate a concise post with a clear opinion.",
    tips: ["Use one concrete idea.", "Open with a direct hook.", "Keep the brief focused."],
    commonMistakes: ["Being too broad.", "Leaving the audience undefined."]
  },
  "explain-deeply": {
    objective: "Generate a long-form brief with thesis and structure.",
    tips: ["Define the thesis early.", "Keep the outline actionable.", "Add the audience and desired depth."],
    commonMistakes: ["Creating a vague outline with no opinion."]
  },
  "engage-audience": {
    objective: "Generate a post that sparks reaction, discussion, or engagement.",
    tips: [
      "State the hypothesis clearly.",
      "Include a question when you want readers to respond.",
      "Use evidence that invites debate."
    ],
    commonMistakes: ["Sounding like a generic announcement instead of an invitation to react."]
  },
  "tell-story": {
    objective: "Generate a short thread with a strong hook and tight flow.",
    tips: ["Lead with tension.", "Keep each beat focused.", "End with a clear conclusion."],
    commonMistakes: ["Trying to fit too many ideas into one thread."]
  },
  "update-subscribers": {
    objective: "Generate a newsletter brief with structure and payoff.",
    tips: ["Define the audience.", "Include the takeaway upfront.", "Suggest a section flow."],
    commonMistakes: ["Overloading the brief with unrelated topics."]
  },
  "document-decision": {
    objective: "Generate a post that explains a technical architecture decision.",
    tips: [
      "Give enough context to understand the system.",
      "Highlight the constraints.",
      "Make the trade-offs explicit."
    ],
    commonMistakes: ["Focusing on implementation details before the design choice."]
  }
};

function isGenerationIntent(intentId: string): intentId is GenerationIntent {
  return intentId in ptGuidance;
}

export function getIntentBriefingGuidance(
  locale: AppLocale,
  intentId: string,
  fallback: BriefingGuidanceView
): BriefingGuidanceCopy {
  if (!isGenerationIntent(intentId)) {
    return fallback;
  }

  return locale === "en" ? enGuidance[intentId] : ptGuidance[intentId];
}
