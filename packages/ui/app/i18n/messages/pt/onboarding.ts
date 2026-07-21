export const onboarding = {
  nameFallback: "você",
  stepLabel: {
    context_setup: "Contexto",
    micro_opinion: "Opinião curta",
    reasoning_reflection: "Como eu penso",
    argument_development: "Como eu construo",
    format_adaptation: "Versatilidade",
    review_confirm: "Revisão"
  },
  helperCopy: {
    micro_opinion: "sem rodeio — só a sua opinião, do jeito que você diria numa conversa.",
    reasoning_reflection: "conte como se estivesse explicando pra um amigo, sem enfeitar.",
    argument_development: "defenda o ponto até o fim — não precisa amaciar.",
    format_adaptation: "explique com calma, como se a pessoa não soubesse nada do assunto."
  },
  sampleCounter: (index: number, total: number) => `amostra ${index} de ${total}`,
  fallbackPrompt: "conte com as suas palavras",
  errorFallback: "não conseguimos confirmar sua voz agora — verifique sua conexão e tente de novo.",
  trialLabel: "seu teste",
  trialDaysRemaining: (n: number) => `${n} ${n === 1 ? "dia restante" : "dias restantes"}`,
  skipForNow: "Calibrar depois →",
  voiceReady: "sua voz está pronta",

  toast: {
    submitError: "não conseguimos salvar essa amostra",
    skipError: "não conseguimos pular essa etapa",
    startFailed: "não conseguimos iniciar a sua calibração agora."
  },

  overlay: {
    recalibrateEyebrow: "recalibrar sua voz",
    close: "fechar"
  },

  buildingVoiceLabel: "construindo sua voz…",

  consent: {
    eyebrow: "autorização formal",
    heading: "posso usar essas amostras pra construir a sua voz?",
    body: 'seus textos são analisados só pra modelar o seu perfil de voz. você pode revogar a qualquer momento em "sua voz".',
    checkboxLabel: "autorizo o uso das minhas amostras",
    createVoice: "Criar minha voz"
  },

  lowConfidence: {
    banner: (weakStepLabel: string) =>
      `a amostra "${weakStepLabel}" ficou curta pra sua voz — dá pra revê-la, ou seguir assim mesmo.`,
    continueAnyway: "Continuar assim mesmo",
    viewSample: "Ver esta amostra"
  },

  result: {
    errorEyebrow: "algo deu errado",
    errorHeading: "não deu pra construir sua voz agora",
    retry: "Refazer"
  },

  review: {
    eyebrow: "revisão"
  },

  step1: {
    eyebrow: "antes de começar",
    heading: "vamos te conhecer",
    subjectLabel: "sobre o que você mais escreve?",
    subjectPlaceholder: "ex.: produto, carreira, tecnologia…",
    vantagePointLabel: "de onde você fala sobre isso?",
    vantagePointPlaceholder: "ex.: fundador técnico, gestora de time, praticante autônomo…",
    audiencesLabel: "pra quem você escreve?",
    audiencePlaceholder: "digite um público e aperte Enter",
    audienceRemoveAria: (value: string) => `remover ${value}`,
    consentBanner: "vamos usar seus textos pra construir seu perfil de voz"
  },

  voicePreview: {
    confidenceEyebrow: "confiança",
    core: "Como você pensa",
    development: "Como você constrói"
  },

  bridge: {
    eyebrow: "pronto",
    highlights: [
      "sua voz já está ativa — cada texto gerado passa por ela",
      'acompanhe a confiança e recalibre quando quiser em "sua voz"',
      "seu teste começou — dá pra gerar direto na próxima tela"
    ],
    skipTour: "Pular tour",
    startWriting: "Começar a escrever →"
  },

  progressAria: "progresso da calibração",

  writing: {
    readOnlyHelper: "essa amostra já foi enviada — dá pra reler, mas não editar aqui.",
    placeholder: "escreva com as suas palavras — não precisa ser perfeito",
    counterBelow: (target: number) => `mais um pouco — cerca de ${target} é o ideal`,
    counterInRange: "boa faixa",
    counterOver: "tudo bem, pode manter",
    skipLink: "pular esta amostra →",
    resumeAtCurrent: "Voltar para onde parei"
  }
};
