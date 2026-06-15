import type { BriefingGuidanceView } from "@my-ai-orchestrator/contracts";
import type { AppContentTypeId } from "./content-types";
import type { AppLocale } from "./types";

type BriefingGuidanceCopy = {
  readonly objective: string;
  readonly tips: readonly string[];
  readonly commonMistakes: readonly string[];
};

const ptGuidance: Record<AppContentTypeId, BriefingGuidanceCopy> = {
  "linkedin-post": {
    objective: "Gerar uma publicação profissional concisa, com opinião clara.",
    tips: [
      "Use uma ideia concreta.",
      "Abra com um gancho direto.",
      "Mantenha o briefing focado."
    ],
    commonMistakes: ["Ser amplo demais.", "Deixar o público indefinido."]
  },
  newsletter: {
    objective: "Montar um briefing de newsletter com estrutura e valor para o leitor.",
    tips: [
      "Defina o público.",
      "Deixe o benefício claro desde o início.",
      "Sugira um fluxo de seções."
    ],
    commonMistakes: ["Sobrecarregar o briefing com temas não relacionados."]
  },
  "validation-post": {
    objective: "Gerar um post curto que valida uma ideia com evidências.",
    tips: [
      "Deixe a hipótese explícita.",
      "Use exemplos que possam ser verificados.",
      "Mantenha o briefing direto."
    ],
    commonMistakes: ["Soar como um anúncio genérico."]
  },
  "architecture-post": {
    objective: "Gerar um post que explica uma decisão técnica de arquitetura.",
    tips: [
      "Dê contexto suficiente para entender o sistema.",
      "Destaque as restrições.",
      "Deixe os trade-offs explícitos."
    ],
    commonMistakes: ["Focar em detalhes de implementação antes da escolha de design."]
  },
  "long-form-blog": {
    objective: "Montar um briefing de artigo longo com tese e estrutura.",
    tips: [
      "Defina a tese cedo.",
      "Mantenha a estrutura acionável.",
      "Inclua público e profundidade desejada."
    ],
    commonMistakes: ["Criar uma estrutura vaga, sem opinião."]
  },
  "twitter-thread": {
    objective: "Gerar uma sequência curta com gancho forte e fluxo enxuto.",
    tips: [
      "Comece com tensão ou curiosidade.",
      "Mantenha cada bloco focado.",
      "Termine com uma conclusão clara."
    ],
    commonMistakes: ["Tentar colocar ideias demais em uma única sequência."]
  }
};

const enGuidance: Record<AppContentTypeId, BriefingGuidanceCopy> = {
  "linkedin-post": {
    objective: "Generate a concise LinkedIn post with a clear opinion.",
    tips: ["Use one concrete idea.", "Open with a direct hook.", "Keep the brief focused."],
    commonMistakes: ["Being too broad.", "Leaving the audience undefined."]
  },
  newsletter: {
    objective: "Generate a newsletter brief with structure and payoff.",
    tips: ["Define the audience.", "Include the takeaway upfront.", "Suggest a section flow."],
    commonMistakes: ["Overloading the brief with unrelated topics."]
  },
  "validation-post": {
    objective: "Generate a short post that validates an idea with evidence.",
    tips: ["State the hypothesis clearly.", "Use examples that can be checked.", "Keep the brief direct."],
    commonMistakes: ["Making the post sound like a generic announcement."]
  },
  "architecture-post": {
    objective: "Generate a post that explains a technical architecture decision.",
    tips: [
      "Give enough context to understand the system.",
      "Highlight the constraints.",
      "Make the trade-offs explicit."
    ],
    commonMistakes: ["Focusing on implementation details before the design choice."]
  },
  "long-form-blog": {
    objective: "Generate a long-form blog brief with thesis and structure.",
    tips: ["Define the thesis early.", "Keep the outline actionable.", "Add the audience and desired depth."],
    commonMistakes: ["Creating a vague outline with no opinion."]
  },
  "twitter-thread": {
    objective: "Generate a short thread with a strong hook and tight flow.",
    tips: ["Lead with tension.", "Keep each beat focused.", "End with a clear conclusion."],
    commonMistakes: ["Trying to fit too many ideas into one thread."]
  }
};

function isAppContentTypeId(contentTypeId: string): contentTypeId is AppContentTypeId {
  return contentTypeId in ptGuidance;
}

export function getBriefingGuidance(
  locale: AppLocale,
  contentTypeId: string,
  fallback: BriefingGuidanceView
): BriefingGuidanceCopy {
  if (!isAppContentTypeId(contentTypeId)) {
    return fallback;
  }

  return locale === "en" ? enGuidance[contentTypeId] : ptGuidance[contentTypeId];
}
