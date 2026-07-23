import type { PracticeDimensionKey } from "@my-ai-orchestrator/contracts";
import type { PracticeProfileLocale } from "./practice-profile-generation-core.js";

export interface NicheAsk {
  readonly question: string;
  readonly dimensions: readonly PracticeDimensionKey[];
}

// G5 · niche-ask (asynchronous, /voice). Fires when G2 grounding comes back thin (obscure field). The
// practitioner is the best source of their own niche, so the ask is curated + deterministic — it can
// never fabricate, costs nothing, and stays available exactly when providers are down (04/spec).
const FRAGMENTS: Readonly<Record<PracticeProfileLocale, Readonly<Record<PracticeDimensionKey, string>>>> = {
  "pt-BR": {
    point: "que debates ou posições em disputa importam nesse assunto?",
    evidence: "o que conta como evidência aqui — números, casos, incidentes? dê um exemplo concreto.",
    readerAssumption: "o que um insider desse campo sabe que um outsider não sabe?",
    resistance: "qual é o contraponto honesto mais forte que você encontra nesse assunto?",
    stake: "por que seu leitor precisaria decidir ou agir sobre isso agora?",
    fieldCliche: "qual é o clichê batido desse campo que você evita de propósito?",
    lexicon: "quais praticantes ou publicações você acompanha, e que termos de insider usa?"
  },
  "en-US": {
    point: "which live debates or contested positions matter in this subject?",
    evidence: "what counts as evidence here — numbers, cases, incidents? give a concrete example.",
    readerAssumption: "what does an insider in this field know that an outsider doesn't?",
    resistance: "what's the strongest honest counterpoint you meet in this subject?",
    stake: "why would your reader need to decide or act on this now?",
    fieldCliche: "which worn cliché of this field do you avoid on purpose?",
    lexicon: "which practitioners or publications do you follow, and what insider terms do you use?"
  }
};

const INTRO: Readonly<Record<PracticeProfileLocale, (subject: string) => string>> = {
  "pt-BR": (subject) => `Pra deixar seu perfil mais específico em "${subject}", me conte:`,
  "en-US": (subject) => `To make your profile more specific in "${subject}", tell me:`
};

export function buildNicheAsk(args: {
  readonly subject: string;
  readonly thinDimensions: readonly PracticeDimensionKey[];
  readonly locale: PracticeProfileLocale;
}): NicheAsk | undefined {
  if (args.thinDimensions.length === 0) {
    return undefined;
  }

  const fragments = FRAGMENTS[args.locale];
  const bullets = args.thinDimensions.map((dimension) => `- ${fragments[dimension]}`);
  const question = [INTRO[args.locale](args.subject), ...bullets].join("\n");

  return { question, dimensions: args.thinDimensions };
}
