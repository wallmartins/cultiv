import type { AppMessages } from "../types";

export const appMessagesPt: AppMessages = {
  shell: {
    nav: {
      generate: "Gerar",
      history: "Histórico",
      voice: "Voz",
      settings: "Configurações",
      logout: "Sair"
    },
    credits: { label: "créditos" },
    activeExecutions: {
      title: "Em andamento",
      empty: "Nenhuma geração ativa",
      openDrawer: "Abrir gerações em andamento",
      closeDrawer: "Fechar gerações em andamento",
      statusQueued: "Na fila",
      statusRunning: "Gerando",
      statusDone: "Pronto",
      statusFailed: "Falhou",
      copy: "Copiar",
      regenerate: "Regenerar",
      viewHistory: "Ver completo no histórico",
      retry: "Tentar de novo",
      noCreditsCharged: "Nenhum crédito foi cobrado.",
      observationFailure: "Perdemos conexão com a geração.",
      refresh: "Atualizar",
      hybridHint:
        "Você pode sair desta tela — avisamos quando o texto estiver pronto. Se preferir, acompanhe cada etapa aqui embaixo."
    },
    sdk: {
      unavailable: "Não foi possível conectar ao servidor. Alguns dados podem estar desatualizados.",
      retry: "Tentar novamente"
    },
    selectPlaceholder: "Selecione uma opção"
  },
  generate: {
    title: "Gerar",
    contentType: "Formato",
    contentTypePlaceholder: "Selecione um formato",
    contentTypeHelp: "Sobre este formato",
    fieldHelp: "Sobre este campo",
    briefing: "Briefing",
    catalogLoadError: "Não foi possível carregar os formatos de conteúdo.",
    catalogRetry: "Tentar novamente",
    language: "Idioma do texto",
    qualityMode: "Modo",
    importedContext: "Material de referência",
    importedContextExpand: "Adicionar material de referência",
    importedContextCounter: "{count} / 8000",
    importedContextTooLarge: "O material de referência deve ter no máximo 8.000 caracteres.",
    previewTitle: "Prévia",
    previewPrice: "Preço: {price} créditos",
    previewBalance: "Saldo: {current} → {projected}",
    generate: "Gerar texto",
    generateWithCredits: "Gerar texto ({price} créditos)",
    calculating: "Calculando…",
    sending: "Enviando…",
    noCredits: "Sem créditos",
    incomplete: "Preencha os campos obrigatórios",
    blocked: "Material bloqueado",
    startedToast: "Geração iniciada",
    guidanceTitle: "Como preencher",
    guidanceTips: "Dicas",
    guidanceMistakes: "Evite",
    reminderBanner: "Sua voz ainda não foi ensinada. Adicione exemplos para melhorar os resultados.",
    reminderBannerAction: "Ensinar minha voz",
    blockedReasons: {
      planRestriction: "Indisponível no seu plano",
      featureFlagDisabled: "Recurso temporariamente indisponível",
      subscriptionInactive: "Assinatura inativa",
      qualityModePlanRestriction: "Disponível em um plano superior",
      insufficientCredits: "Créditos insuficientes"
    }
  },
  qualityModes: {
    fast: "Direto",
    balanced: "Equilibrado",
    strict: "Afinado",
    helper: "Todos os modos preservam sua voz; o modo afeta profundidade e revisão.",
    recommended: "Recomendado",
    help: "Sobre este modo",
    descriptions: {
      fast: "Geração mais rápida e econômica, com menos revisão.",
      balanced: "Equilíbrio entre velocidade e profundidade, com revisão moderada.",
      strict: "Máxima profundidade e revisão, ideal para pedidos complexos."
    },
    unlockPlan: "Disponível a partir do plano {plan}.",
    insufficientCredits: "Créditos insuficientes para usar este modo agora.",
    plans: {
      free: "Gratuito",
      starter: "Starter",
      pro: "Pro",
      enterprise: "Enterprise"
    }
  },
  executionSteps: {
    fallback: {
      summary: "Estamos processando esta etapa da geração."
    },
    queued: {
      label: "Na fila",
      summary: "Sua solicitação entrou na fila e será processada em instantes."
    },
    analyze: {
      label: "Análise do briefing",
      summary: "Organizamos tema, objetivo e material de referência para orientar o rascunho."
    },
    draft: {
      label: "Rascunho",
      summary: "Geramos o texto inicial alinhado ao seu perfil de voz e ao formato escolhido."
    },
    refine: {
      label: "Refinamento",
      summary: "Ajustamos tom, clareza e aderência à sua voz antes da revisão final."
    },
    sanitize: {
      label: "Revisão final",
      summary: "Aplicamos checagens de segurança e consistência antes de liberar o resultado."
    }
  },
  history: {
    title: "Histórico",
    subtitle: "Suas gerações anteriores.",
    empty: "Nenhuma geração ainda.",
    emptyAction: "Ir para Geração",
    error: "Não foi possível carregar o histórico.",
    retry: "Tentar novamente",
    filters: {
      period: "Período",
      status: "Status",
      contentType: "Formato",
      period7d: "7 dias",
      period30d: "30 dias",
      period90d: "90 dias",
      periodAll: "Tudo",
      statusAll: "Todos",
      statusDone: "Concluídas",
      statusFailed: "Falhas",
      statusRunning: "Em andamento",
      statusQueued: "Na fila",
      contentTypeAll: "Todos os formatos"
    },
    columns: {
      format: "Formato",
      date: "Data",
      mode: "Modo",
      credits: "Créditos",
      status: "Status"
    },
    detail: {
      copy: "Copiar",
      regenerate: "Regenerar",
      details: "Detalhes",
      executionId: "ID da execução",
      createdAt: "Criado em",
      completedAt: "Concluído em",
      voiceConfidence: "Confiança da voz",
      adaptationMode: "Modo de adaptação",
      progressSteps: "Etapas",
      loading: "Carregando execução…",
      notFound: "Execução não encontrada."
    }
  },
  voice: {
    dashboardTitle: "Voz",
    dashboardSubtitle: "Perfil, diagnósticos e exemplos da sua escrita.",
    dashboardEmpty:
      "Você ainda não tem um perfil de voz. Adicione textos seus para a IA aprender como você escreve.",
    dashboardEmptyAction: "Adicionar primeiro exemplo",
    confidence: "Confiança",
    confidenceLabels: {
      high: "Alta",
      medium: "Média",
      low: "Baixa",
      none: "—"
    },
    adaptationMode: "Modo de adaptação",
    diagnostics: "Diagnósticos",
    coverage: "Cobertura por formato",
    bestCovered: "Melhor cobertos",
    underrepresented: "Sub-representados",
    examplesTitle: "Exemplos",
    examplesEmpty: "Nenhum exemplo ainda.",
    examplesEmptyAction: "Adicionar exemplo",
    addExamples: "Adicionar exemplos",
    newExampleTitle: "Novo exemplo",
    editExampleTitle: "Editar exemplo",
    updatingBanner: "Atualizando sua voz…",
    rebuildFailed: "A última atualização do perfil falhou.",
    upgradeSoon: "Em breve",
    composer: {
      addSlot: "Adicionar outro exemplo",
      save: "Salvar exemplos",
      advanced: "Opções avançadas",
      removeSlot: "Remover",
      slotTitle: "Exemplo {n}",
      text: "Texto",
      format: "Formato",
      formatHelp: "Sobre este formato",
      language: "Idioma",
      context: "Contexto",
      antiPatterns: "Anti-padrões",
      pinned: "Fixar este exemplo",
      required: "Obrigatório",
      tooShort: "Muito curto para aprender sua voz",
      formatRequired: "Selecione um formato",
      languageRequired: "Selecione um idioma",
      saving: "Salvando…"
    },
    consent: {
      title: "Uso dos seus exemplos de voz",
      body: "Para aprender sua escrita, o Cultiv armazena e processa os textos que você enviar. Você pode revogar isso depois em Configurações.",
      cancel: "Cancelar",
      accept: "Concordo e continuar"
    }
  },
  onboarding: {
    stepLabel: "Passo {current} de {total}",
    step1Title: "Ensine sua voz",
    step1Subtitle: "Cole textos seus para a IA aprender como você escreve.",
    step2Title: "Você está pronto para gerar",
    skip: "Pular",
    continue: "Continuar",
    goGenerate: "Ir para Geração",
    confidence: "Confiança da voz",
    credits: "Créditos disponíveis"
  },
  settings: {
    title: "Configurações",
    profile: "Perfil",
    email: "Email",
    locale: "Idioma do app",
    localePt: "Português (Brasil)",
    localeEn: "English",
    privacy: "Privacidade de voz",
    consentActive: "Consentimento ativo",
    consentMissing: "Não concedido",
    revokeConsent: "Revogar consentimento",
    revokeDisabled: "Revogação disponível quando a API estiver publicada.",
    logout: "Sair"
  },
  notifications: {
    readyTitle: "Geração pronta",
    readyAction: "Ver resultado"
  },
  errors: {
    safetyInputBlocked: {
      title: "Conteúdo bloqueado",
      message: "Ajuste o briefing ou o material de referência e tente novamente.",
      action: "Editar briefing"
    },
    safetyInputQuarantined: {
      title: "Conteúdo precisa de ajuste",
      message: "Revise o material colado antes de gerar.",
      action: "Revisar material"
    },
    quoteStale: {
      title: "Preço desatualizado",
      message: "Atualizamos a prévia com o preço mais recente.",
      action: "Atualizar prévia"
    },
    usageRestricted: {
      title: "Sem créditos ou limite atingido",
      message: "Aguarde a renovação dos créditos ou ajuste o plano.",
      action: "Entendi"
    },
    authenticationExpired: {
      title: "Sessão expirada",
      message: "Entre novamente para continuar.",
      action: "Entrar"
    },
    voiceConsentRequired: {
      title: "Consentimento necessário",
      message: "Aceite o uso dos seus exemplos de voz antes de salvar.",
      action: "Revisar consentimento"
    },
    rateLimited: {
      title: "Muitas tentativas",
      message: "Aguarde um momento e tente novamente.",
      action: "Ok"
    },
    serviceUnavailable: {
      title: "Serviço indisponível",
      message: "Tente novamente em instantes.",
      action: "Tentar novamente"
    },
    observationFailure: {
      title: "Conexão perdida",
      message: "Perdemos conexão com a geração. Atualize para ver o status.",
      action: "Atualizar"
    },
    default: {
      title: "Algo deu errado",
      message: "Tente novamente em instantes.",
      action: "Tentar novamente"
    }
  }
};
