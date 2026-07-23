// quality-mode/gate keys line up with the contracts' own literal unions (QualityMode,
// BillingGenerationGate) so generate-view.ts can index this object directly with those types
// without this package importing them.
export const generate = {
  hero: {
    eyebrow: "escreve como você pensa",
    headlinePrefix: "Sobre o que você quer ",
    headlineEmphasis: "escrever",
    headlineSuffix: "?",
    placeholder: "Cole uma ideia, uma inquietação, um tema…",
    footerNote: "a sessão guiada vem depois · pulável"
  },
  voiceRebuildNotice: "sua voz não terminou de atualizar — revisar",
  analyzingTheme: "analisando o seu tema…",
  startingGeneration: "iniciando a geração…",
  channelEyebrow: "canal · opcional",
  channelPrompt: "Onde você vai publicar?",
  channelNote: "opcional — pular deixa como texto livre",
  channelSkipLink: "pular · fica como texto livre →",
  audienceEyebrow: "público · estreitar",
  audiencePrompt: "Pra quem é esse texto, dessa vez?",
  audienceAddPlaceholder: "outro público…",
  audienceAddAction: "+ adicionar",
  audienceSkipLink: "usar todos os públicos →",
  questionPlaceholder: "Responda com uma ou duas frases…",
  questionSkipLink: "pular pergunta →",
  answerAction: "Responder →",
  generateNow: "Gerar agora →",
  costHint: "quanto mais você conta, mais denso fica o texto",
  costCalculating: "custo: calculando…",
  costFrom: (creditsLabel: string) => `custo: a partir de ${creditsLabel}`,
  costFull: (creditsLabel: string, balanceAfter: number, mode: string) =>
    `custo: ${creditsLabel} · saldo depois: ${balanceAfter} · modo: ${mode}`,
  sessionDoneEyebrow: "sessão concluída",
  sessionDoneMessage: "Tudo pronto. É só gerar.",
  dispatchError: "créditos não cobrados — tente de novo",
  fallbackQuestion: {
    thesis: (theme: string) => `Qual é a tese ou hipótese central que você quer defender sobre "${theme}"?`,
    experience: "Que experiência concreta sua seria o melhor exemplo aqui?",
    tension: "Existe um contraponto, uma tensão ou uma objeção que vale a pena nomear?",
    motivation: "Por que esse tema importa pra você agora?"
  },
  questionEyebrow: (current: number, total: number) => `pergunta ${current} de ${total} · pulável`,
  channelBucketLabel: {
    professionalNetwork: "Rede profissional",
    social: "Redes sociais",
    blog: "Blog",
    email: "Newsletter"
  },
  qualityModeLabel: {
    fast: "rápido",
    balanced: "equilibrado",
    strict: "denso"
  },
  trialLabel: "período de teste",
  trialTextsEstimate: (textsLabel: string) => `~${textsLabel}`,
  // Whole phrase per language: "restante" has to agree in number, so it cannot be appended to a
  // pre-pluralized fragment ("1 dia restantes" was the bug).
  trialDaysRemaining: (days: number) => (days === 1 ? "1 dia restante" : `${days} dias restantes`),
  gateMessage: {
    no_credits: "sem créditos suficientes para gerar",
    trial_expired: "seu teste expirou",
    past_due: "pagamento pendente",
    lapsed: "assinatura inativa"
  },
  gateFallback: "não é possível gerar agora",
  queueEta: (minutes: number) => `~${minutes} min`
};
