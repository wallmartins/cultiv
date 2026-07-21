// Intent labels mirror apps/backend/.../catalog/generation-intent-catalog.ts INTENT_CATALOG_COPY
// pt-BR — duplicated locally (apps/web generate-view.ts) rather than pulling backend code across
// the boundary. Platform/quality-mode/gate keys line up with the contracts' own literal unions
// (GenerationChannel ids, QualityMode, BillingGenerationGate) so generate-view.ts can index this
// object directly with those types without this package importing them.
export const generate = {
  hero: {
    eyebrow: "escreve como você pensa",
    headlinePrefix: "Sobre o que você quer ",
    headlineEmphasis: "escrever",
    headlineSuffix: "?",
    placeholder: "Cole uma ideia, uma inquietação, um tema…",
    footerNote: "a sessão guiada vem depois · pulável"
  },
  analyzingTheme: "analisando o seu tema…",
  startingGeneration: "iniciando a geração…",
  channelEyebrow: "canal · opcional",
  channelPrompt: "Onde você vai publicar?",
  channelNote: "opcional — pular deixa como texto livre",
  channelSkipLink: "pular · fica como texto livre →",
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
  ambiguityPrompt: (intentA: string, intentB: string) => `Isso é mais sobre ${intentA} ou sobre ${intentB}?`,
  ambiguityNote: "me diga em uma frase — isso muda o ângulo do texto",
  intentLabel: {
    "share-idea": "compartilhar uma ideia",
    "explain-deeply": "explicar a fundo",
    "engage-audience": "engajar sua audiência",
    "tell-story": "contar uma história",
    "update-subscribers": "atualizar quem te acompanha",
    "document-decision": "registrar uma decisão"
  },
  fallbackQuestion: {
    thesis: (theme: string) => `Qual é a tese ou hipótese central que você quer defender sobre "${theme}"?`,
    experience: "Que experiência concreta sua seria o melhor exemplo aqui?",
    tension: "Existe um contraponto, uma tensão ou uma objeção que vale a pena nomear?",
    motivation: "Por que esse tema importa pra você agora?"
  },
  questionEyebrow: (current: number, total: number) => `pergunta ${current} de ${total} · pulável`,
  platformLabel: {
    linkedin: "LinkedIn",
    x: "X",
    instagram: "Instagram",
    medium: "Medium",
    substack: "Substack",
    blog: "Blog próprio",
    newsletter: "Newsletter"
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
