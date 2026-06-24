import type { AppContentTypeId } from "./content-types";
import type { AppLocale } from "./types";

type FieldCopy = {
  readonly label: string;
  readonly helpText?: string;
};

type FieldLabelMap = Record<string, Record<string, FieldCopy>>;

const ptLabels: FieldLabelMap = {
  "linkedin-post": {
    topic: { label: "Tema", helpText: "Descreva a ideia principal da publicação." },
    audience: { label: "Audiência", helpText: "Quem deve se interessar por este conteúdo." },
    angle: { label: "Ângulo", helpText: "Opinião ou enquadramento que você quer transmitir." },
    proof: { label: "Pontos de prova", helpText: "Liste exemplos concretos ou evidências." }
  },
  newsletter: {
    topic: { label: "Tema", helpText: "Tema principal da edição." },
    audience: { label: "Audiência", helpText: "Segmento de leitores." },
    promise: { label: "Promessa central", helpText: "Valor que o leitor leva desta edição." },
    sections: { label: "Seções", helpText: "Seções ou blocos que a edição deve incluir." }
  },
  "validation-post": {
    topic: { label: "Tema", helpText: "Problema ou ideia que você quer validar." },
    hypothesis: { label: "Hipótese", helpText: "O que você quer provar ou refutar." },
    evidence: { label: "Pontos de prova", helpText: "Fatos ou exemplos que sustentam a hipótese." },
    question: { label: "Pergunta", helpText: "Formule uma pergunta para provocar discussão." }
  },
  "architecture-post": {
    systemContext: { label: "Contexto do sistema", helpText: "Arquitetura ou limites do sistema." },
    tradeoffs: { label: "Trade-offs", helpText: "Principais compromissos de design." },
    decision: { label: "Decisão", helpText: "Recomendação ou conclusão." }
  },
  "long-form-blog": {
    topic: { label: "Tema", helpText: "Assunto do artigo." },
    thesis: { label: "Tese", helpText: "Argumento central." },
    outline: { label: "Estrutura", helpText: "Seções do artigo." },
    audience: { label: "Audiência", helpText: "Para quem o artigo é escrito." }
  },
  "twitter-thread": {
    topic: { label: "Tema", helpText: "Assunto da sequência." },
    hook: { label: "Gancho", helpText: "Abertura que prende a atenção." },
    beats: { label: "Blocos", helpText: "Pontos principais da sequência." }
  }
};

const enLabels: FieldLabelMap = {
  "linkedin-post": {
    topic: { label: "Topic", helpText: "Describe the main idea of the post." },
    audience: { label: "Audience", helpText: "Specify who should care about the post." },
    angle: { label: "Angle", helpText: "State the opinion or framing you want." },
    proof: { label: "Proof points", helpText: "List concrete examples or evidence." }
  },
  newsletter: {
    topic: { label: "Topic", helpText: "Describe the main theme of the newsletter." },
    audience: { label: "Audience", helpText: "Specify the reader segment." },
    promise: { label: "Core promise", helpText: "State the value the reader gets." },
    sections: { label: "Sections", helpText: "List the sections or beats to include." }
  },
  "validation-post": {
    topic: { label: "Topic", helpText: "Describe the issue being validated." },
    hypothesis: { label: "Hypothesis", helpText: "State what you want to prove or disprove." },
    evidence: { label: "Evidence", helpText: "List the supporting facts or examples." },
    question: { label: "Question", helpText: "Pose a question to spark discussion." }
  },
  "architecture-post": {
    systemContext: { label: "System context", helpText: "Describe the architecture or system boundaries." },
    tradeoffs: { label: "Trade-offs", helpText: "List the main design trade-offs." },
    decision: { label: "Decision", helpText: "State the recommendation or conclusion." }
  },
  "long-form-blog": {
    topic: { label: "Topic", helpText: "Describe the article subject." },
    thesis: { label: "Thesis", helpText: "State the main argument." },
    outline: { label: "Outline", helpText: "List the article sections." },
    audience: { label: "Audience", helpText: "Specify who the article is for." }
  },
  "twitter-thread": {
    topic: { label: "Topic", helpText: "Describe the thread subject." },
    hook: { label: "Hook", helpText: "Write the opening hook." },
    beats: { label: "Beats", helpText: "List the key thread beats." }
  }
};

function getFieldMap(locale: AppLocale): FieldLabelMap {
  return locale === "en" ? enLabels : ptLabels;
}

export function getFieldLabel(
  locale: AppLocale,
  contentTypeId: string,
  fieldKey: string,
  fallback: string
): string {
  return getFieldMap(locale)[contentTypeId]?.[fieldKey]?.label ?? fallback;
}

export function getFieldHelpText(
  locale: AppLocale,
  contentTypeId: string,
  fieldKey: string,
  fallback: string | undefined
): string | undefined {
  return getFieldMap(locale)[contentTypeId]?.[fieldKey]?.helpText ?? fallback;
}

export function hasFieldCopy(contentTypeId: AppContentTypeId, fieldKey: string): boolean {
  return Boolean(ptLabels[contentTypeId]?.[fieldKey]);
}
