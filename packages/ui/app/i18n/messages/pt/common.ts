// Shared vocabulary. LENGTH_LABEL / CHANNEL_LABEL were duplicated across detail-view.ts,
// history-view.ts and states/DegradedDeliveryBanner.tsx — they live here once now.
export const common = {
  retry: "Tentar de novo",
  cancel: "Cancelar",
  close: "Fechar",
  back: "Voltar",
  continue: "Continuar",
  justNow: "agora",
  loading: "carregando…",
  noTopic: "sem tema",
  freeText: "Texto livre",
  length: {
    short: "Curto",
    medium: "Médio",
    long: "Longo"
  },
  channel: {
    "professional-network": "LinkedIn",
    blog: "Blog",
    email: "Newsletter",
    social: "X"
  },
  // Was hardcoded pt-BR in packages/shared/src/derive/voice-profile.ts, which both the voice
  // screen and the shell companion read. This is the single source now — confidenceCaption /
  // confidenceHeadline were deleted from that module and callers read these keys directly.
  confidence: {
    caption: { low: "Baixa", medium: "Média", high: "Alta" },
    headline: { low: "Voz emergente", medium: "Voz em formação", high: "Voz sólida" }
  },
  credits: (n: number) => `${n} ${n === 1 ? "crédito" : "créditos"}`,
  texts: (n: number) => `${n} ${n === 1 ? "texto" : "textos"}`,
  samples: (n: number) => `${n} ${n === 1 ? "amostra" : "amostras"}`,
  days: (n: number) => `${n} ${n === 1 ? "dia" : "dias"}`,
  words: (n: number) => `${n} ${n === 1 ? "palavra" : "palavras"}`,
  generations: (n: number) => `${n} ${n === 1 ? "geração" : "gerações"}`
};
