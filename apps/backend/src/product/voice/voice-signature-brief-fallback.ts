import type {
  ArgumentDevelopmentSignature,
  CertaintyLevel,
  ConclusionPace,
  EpistemicPosture,
  JudgmentFrequency,
  ReaderRelationship,
  ReasoningExtractionResult
} from "@my-ai-orchestrator/contracts";
import type { VoiceSignatureBrief } from "./voice-signature-brief.js";

export interface SignatureProseLanguage {
  readonly primary: string;
}

function certaintySentencePt(level: CertaintyLevel): string {
  if (level === "low") {
    return "Você evita fechar cedo demais e deixa a dúvida aparecer quando ela existe.";
  }

  if (level === "high") {
    return "Você costuma assumir posições com clareza e pouca hesitação.";
  }

  return "Você equilibra observação e posição sem soar absolutista.";
}

function judgmentSentencePt(level: JudgmentFrequency): string {
  if (level === "low") {
    return "Prefere descrever o que percebeu antes de julgar.";
  }

  if (level === "high") {
    return "Não hesita em emitir juízo quando o texto pede uma tomada de posição.";
  }

  return "Julga com moderação, sem transformar cada parágrafo em veredito.";
}

function paceSentencePt(level: ConclusionPace): string {
  if (level === "slow") {
    return "Deixa a tensão amadurecer antes de chegar à conclusão.";
  }

  if (level === "fast") {
    return "Chega ao ponto com pouca volta antes de encerrar.";
  }

  return "Desenvolve o raciocínio em ritmo medido, sem apressar a conclusão.";
}

function relationshipSentencePt(level: ReaderRelationship): string {
  switch (level) {
    case "mentor":
      return "Escreve como quem orienta, mas sem impor regras universais.";
    case "observer":
      return "Mantém distância analítica e convida o leitor a observar junto.";
    case "guide":
      return "Conduz o leitor passo a passo sem perder proximidade.";
    case "collaborator":
      return "Puxa o leitor para dentro do raciocínio como parceiro de conversa.";
    default:
      return "Mantém relação de par com o leitor, sem tom professoral.";
  }
}

function certaintySentenceEn(level: CertaintyLevel): string {
  if (level === "low") {
    return "You avoid closing too early and let doubt show when it is still present.";
  }

  if (level === "high") {
    return "You usually take clear positions with little hedging.";
  }

  return "You balance observation and stance without sounding absolutist.";
}

function judgmentSentenceEn(level: JudgmentFrequency): string {
  if (level === "low") {
    return "You prefer to describe what you noticed before judging.";
  }

  if (level === "high") {
    return "You do not hesitate to judge when the text calls for a position.";
  }

  return "You judge in moderation instead of turning every paragraph into a verdict.";
}

function paceSentenceEn(level: ConclusionPace): string {
  if (level === "slow") {
    return "You let tension build before arriving at a conclusion.";
  }

  if (level === "fast") {
    return "You get to the point quickly before closing.";
  }

  return "You develop reasoning at a measured pace without rushing the ending.";
}

function relationshipSentenceEn(level: ReaderRelationship): string {
  switch (level) {
    case "mentor":
      return "You write as someone guiding without prescribing universal rules.";
    case "observer":
      return "You keep analytical distance and invite the reader to observe with you.";
    case "guide":
      return "You walk the reader through the reasoning without losing proximity.";
    case "collaborator":
      return "You pull the reader into the reasoning as a conversation partner.";
    default:
      return "You keep a peer relationship with the reader instead of lecturing.";
  }
}

export function deriveReasoningProseFromBrief(
  brief: VoiceSignatureBrief,
  outputLanguage: SignatureProseLanguage
): string {
  const traits = brief.suggestedReasoning;
  const sentences =
    outputLanguage.primary === "pt"
      ? [
          certaintySentencePt(traits.certaintyLevel),
          judgmentSentencePt(traits.judgmentFrequency),
          paceSentencePt(traits.conclusionPace),
          relationshipSentencePt(traits.readerRelationship)
        ]
      : [
          certaintySentenceEn(traits.certaintyLevel),
          judgmentSentenceEn(traits.judgmentFrequency),
          paceSentenceEn(traits.conclusionPace),
          relationshipSentenceEn(traits.readerRelationship)
        ];

  return sentences.join(" ");
}

function inferEpistemicPosture(brief: VoiceSignatureBrief): EpistemicPosture {
  if (brief.suggestedReasoning.certaintyLevel === "high") {
    return "advocacy";
  }

  if (brief.aggregate.hedgingMarkerCount > brief.aggregate.certaintyMarkerCount) {
    return "exploratory";
  }

  return "investigative";
}

export function deriveDevelopmentProseFromBrief(
  brief: VoiceSignatureBrief,
  outputLanguage: SignatureProseLanguage
): string {
  const developmentSteps = brief.stepObservations.filter((observation) =>
    ["reasoning_reflection", "argument_development", "format_adaptation"].includes(observation.stepId)
  );
  const openings = new Set(developmentSteps.map((step) => step.openingPattern));
  const transitions = brief.aggregate.transitionMarkerCount;
  const paragraphs = brief.aggregate.paragraphCount;
  const pt = outputLanguage.primary === "pt";

  const parts: string[] = [];

  if (openings.has("context") || openings.has("question")) {
    parts.push(
      pt
        ? "Seus textos costumam abrir situando o leitor antes de avançar para o ponto central."
        : "Your texts usually open by situating the reader before moving to the main point."
    );
  } else {
    parts.push(
      pt
        ? "Seus textos tendem a abrir com uma observação ou posição direta."
        : "Your texts tend to open with a direct observation or position."
    );
  }

  if (transitions >= 2) {
    parts.push(
      pt
        ? "Você costuma amarrar os movimentos do raciocínio com transições explícitas."
        : "You often connect argumentative moves with explicit transitions."
    );
  } else {
    parts.push(
      pt
        ? "Você avança por acúmulo de exemplos e observações mais do que por conectivos formais."
        : "You advance through accumulated examples and observations more than formal connectors."
    );
  }

  if (paragraphs >= 3) {
    parts.push(
      pt
        ? "Quando o texto cresce, você distribui o argumento em blocos em vez de concentrar tudo em um único fio."
        : "As texts grow, you distribute the argument across blocks instead of one single thread."
    );
  }

  parts.push(
    pt
      ? "Em temas complexos, você simplifica o caminho sem perder nuance antes de fechar."
      : "On complex topics, you simplify the path without losing nuance before closing."
  );

  return parts.join(" ");
}

export function synthesizeReasoningExtractionFromBrief(
  brief: VoiceSignatureBrief,
  outputLanguage: SignatureProseLanguage
): ReasoningExtractionResult {
  return {
    core: {
      narrativeProse: deriveReasoningProseFromBrief(brief, outputLanguage),
      certaintyLevel: brief.suggestedReasoning.certaintyLevel,
      judgmentFrequency: brief.suggestedReasoning.judgmentFrequency,
      conclusionPace: brief.suggestedReasoning.conclusionPace,
      readerRelationship: brief.suggestedReasoning.readerRelationship,
      authoritySource: brief.suggestedReasoning.authoritySource,
      derivedAntiPatterns: []
    },
  };
}

export function synthesizeDevelopmentFromBrief(
  brief: VoiceSignatureBrief,
  outputLanguage: SignatureProseLanguage
): ArgumentDevelopmentSignature {  const epistemicPosture = inferEpistemicPosture(brief);
  const pt = outputLanguage.primary === "pt";

  return {
    developmentProse: deriveDevelopmentProseFromBrief(brief, outputLanguage),
    moveLabels: pt
      ? ["observacao", "desenvolvimento", "exemplo", "conclusao"]
      : ["observation", "development", "example", "conclusion"],
    transitionTendencies: [
      {
        from: pt ? "observacao" : "observation",
        to: pt ? "desenvolvimento" : "development",
        frequency: brief.aggregate.transitionMarkerCount >= 2 ? "common" : "occasional"
      },
      {
        from: pt ? "desenvolvimento" : "development",
        to: pt ? "conclusao" : "conclusion",
        frequency: brief.suggestedReasoning.conclusionPace === "slow" ? "occasional" : "common"
      }
    ],
    epistemicPosture,
    structuralAntiPatterns: []
  };
}
