import type { AppMessages } from "../types";

export const appMessagesPt: AppMessages = {
  auth: {
    signingIn: "Entrando…",
    redirectingToLogin: "Redirecionando para o login…",
    preparingSession: "Preparando sessão…",
    sessionPrepareFailed:
      "Não foi possível preparar a sessão com o backend. Verifique se o servidor está em execução e se o audience do Auth0 está correto.",
    logoutAndSignInAgain: "Sair e entrar de novo",
    sessionPrepareFailedLogin: "Não foi possível preparar a sessão. Tente /login novamente.",
    openingLogin: "Abrindo login…",
    loginFailed: "Não foi possível concluir o login. Tente novamente em /login.",
    sessionPrepareFailedCallback: "Não foi possível preparar a sessão. Volte para /login e tente novamente.",
    finishingLogin: "Finalizando login…"
  },
  shell: {
    nav: {
      generate: "Gerar",
      history: "Caderno de bordo",
      voice: "Mapa da voz",
      settings: "Ajustes de navegação",
      plans: "Recursos da jornada",
      logout: "Sair"
    },
    quota: { label: "gerações" },
    activeExecutions: {
      title: "Em andamento",
      empty: "Nenhuma geração ativa",
      openDrawer: "Abrir gerações em andamento",
      closeDrawer: "Fechar gerações em andamento",
      statusQueued: "Na fila",
      statusRunning: "Gerando",
      statusDone: "Pronto",
      statusFailed: "A rota não pôde ser traçada.",
      copy: "Copiar",
      export: "Exportar",
      regenerate: "Regenerar",
      newExpedition: "Nova expedição",
      viewHistory: "Ver completo no histórico",
      retry: "Tentar de novo",
      noCreditsCharged: "Seus créditos não foram consumidos.",
      observationFailure: "Perdemos conexão com a geração.",
      refresh: "Atualizar",
      hybridHint:
        "Sua rota está sendo traçada… Você pode fechar esta janela."
    },
    sdk: {
      unavailable: "Não foi possível conectar ao servidor. Alguns dados podem estar desatualizados.",
      retry: "Tentar novamente"
    },
    selectPlaceholder: "Selecione uma opção",
    notFound: "Território não encontrado."
  },
  intentWizard: {
    stepObjectiveTitle: "O que você quer explorar?",
    stepObjectiveSubtitle: "Escolha o tipo de expedição para sua ideia.",
    stepScopeTitle: "Escala e destino",
    stepScopeSubtitle: "Defina a profundidade da exploração e onde ela será publicada.",
    moreOptions: "Mais opções",
    lengthTier: "Profundidade",
    channel: "Território de publicação",
    channelOptional: "Opcional",
    channelExpand: "Escolher território",
    intentHelp: "Sobre esta expedição",
    back: "Voltar",
    continue: "Continuar",
    changeIntent: "Trocar expedição",
    catalogLoadError: "Não foi possível carregar as expedições.",
    catalogRetry: "Tentar novamente",
    stepIndicator: "Passo {current} de {total}",
    stepExplorar: "Explorar",
    stepEscala: "Escala",
    stepCoordenadas: "Coordenadas"
  },
  generate: {
    title: "Expedição",
    contentType: "Formato",
    contentTypePlaceholder: "Selecione um formato",
    contentTypeHelp: "Sobre este formato",
    fieldHelp: "Sobre este campo",
    briefing: "Coordenadas da viagem",
    catalogLoadError: "Não foi possível carregar os formatos de conteúdo.",
    catalogRetry: "Tentar novamente",
    language: "Idioma do mapa",
    qualityMode: "Estilo de navegação",
    importedContext: "Materiais de apoio",
    importedContextExpand: "Adicionar materiais de apoio",
    importedContextCounter: "{count} / 8000",
    importedContextTooLarge: "Os materiais de apoio devem ter no máximo 8.000 caracteres.",
    previewTitle: "Recursos da viagem",
    previewPrice: "Custo: {price} créditos",
    previewBalance: "Saldo: {current} → {projected}",
    previewQuota: "Usa ~{cost} geração(ões) · Restam aprox. {remaining} de {limit}",
    previewRefreshRecommendation: "Atualizar recomendação",
    previewRecommendationStale: "As coordenadas mudaram — atualize a recomendação.",
    generate: "Traçar rota",
    generateWithCredits: "Traçar rota ({price} créditos)",
    calculating: "Calculando…",
    sending: "Sua rota está sendo traçada…",
    noCredits: "Sem créditos",
    incomplete: "Preencha as coordenadas obrigatórias",
    blocked: "Material bloqueado",
    startedToast: "Expedição iniciada",
    guidanceTitle: "Como preencher as coordenadas",
    guidanceTips: "Dicas de navegação",
    guidanceMistakes: "Evite",
    reminderBanner: "Seu território de voz ainda está vazio. Adicione matéria-prima para mapear sua voz.",
    reminderBannerAction: "Mapear minha voz",
    blockedReasons: {
      planRestriction: "Indisponível no seu plano",
      featureFlagDisabled: "Recurso temporariamente indisponível",
      subscriptionInactive: "Assinatura inativa",
      qualityModePlanRestriction: "Disponível em um plano superior",
      insufficientCredits: "Créditos insuficientes"
    }
  },
  qualityModes: {
    fast: "Leve",
    balanced: "Equilibrado",
    strict: "Polido",
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
      label: "Na prensa",
      summary: "Seu pedido entrou na prensa e aguarda o início do entalhe."
    },
    analyze: {
      label: "Preparação dos moldes",
      summary: "Estruturamos as diretrizes do briefing e moldamos a matéria-prima."
    },
    draft: {
      label: "Primeira impressão",
      summary: "Gravamos as primeiras palavras alinhadas à cadência e voz do seu perfil."
    },
    refine: {
      label: "Afinamento",
      summary: "Afinamos a textura e a aderência autoral antes do acabamento."
    },
    sanitize: {
      label: "Revisão final",
      summary: "Realizamos o polimento final e checagens de integridade antes da entrega."
    }
  },
  history: {
    title: "Caderno de bordo",
    subtitle: "Todas as suas expedições em um só lugar.",
    empty: "Nenhuma expedição ainda. Trace sua primeira rota.",
    emptyAction: "Nova expedição",
    error: "Não foi possível carregar o caderno de bordo.",
    retry: "Tentar novamente",
    filters: {
      period: "Período",
      status: "Status",
      intent: "Expedição",
      lengthTier: "Formato",
      period7d: "Últimos 7 dias",
      period30d: "Últimos 30 dias",
      period90d: "Últimos 90 dias",
      periodAll: "Todo o período",
      statusAll: "Todos",
      statusDone: "Concluídas",
      statusFailed: "Falhas",
      statusRunning: "Em andamento",
      statusQueued: "Na fila",
      intentAll: "Todas as expedições",
      lengthTierAll: "Todos os formatos"
    },
    columns: {
      format: "Formato",
      date: "Data de partida",
      mode: "Modo",
      credits: "Créditos",
      status: "Status"
    },
    detail: {
      copy: "Copiar",
      regenerate: "Nova expedição",
      details: "Detalhes da rota",
      executionId: "ID da expedição",
      createdAt: "Partida",
      completedAt: "Retorno",
      voiceConfidence: "Confiança da voz",
      adaptationMode: "Modo de adaptação",
      progressSteps: "Etapas",
      loading: "Carregando expedição…",
      notFound: "Expedição não encontrada."
    }
  },
  voice: {
    dashboardTitle: "Mapa da sua voz",
    dashboardSubtitle: "Como você navega, como traça rotas — e como melhorar.",
    dashboardEmpty:
      "Seu mapa ainda está em branco. Ensine sua voz para começar.",
    dashboardEmptyAction: "Adicionar primeiro texto",
    manageExamples: "Gerenciar textos",
    mirrorFallbackTitle: "Seu mapa hoje",
    mirrorFallbackSubtitle:
      "Com mais textos de referência, o Cultiv passa a mapear também seus padrões cognitivos e argumentativos.",
    mapLayersTitle: "Camadas do mapa",
    dashboardTabs: {
      overview: "Panorama",
      layers: "Camadas",
      health: "Saúde do mapa"
    },
    detailLayers: {
      formats: "Rotas por território",
      antiPatterns: "Terrenos a evitar",
      profileHealth: "Saúde da expedição"
    },
    nextStep: {
      eyebrow: "Próxima rota",
      matureMessage:
        "Seu mapa de voz está completo. O próximo passo natural é traçar uma nova expedição.",
      generateCta: "Nova expedição",
      messages: {
        add_more_examples:
          "Mais exemplos deixam sua voz mais previsível e consistente nas gerações.",
        add_examples_from_other_content_types:
          "Um exemplo em outro formato ajuda o Cultiv a te ler em mais contextos.",
        review_conflicting_examples:
          "Alguns exemplos puxam sua voz em direções diferentes. Vale revisar o conjunto.",
        remove_pinned_example:
          "Há exemplos fixados demais para o tamanho atual da base. Considere liberar um fixado.",
        retry_batch_commit: "A última gravação em lote não concluiu. Tente enviar os exemplos de novo.",
        wait_for_profile_update: "Estamos recalculando sua voz com base nos exemplos mais recentes.",
        upgrade_plan: "Seu plano atual limita quantos exemplos entram no perfil."
      },
      ctas: {
        add_more_examples: "Adicionar exemplo",
        add_examples_from_other_content_types: "Adicionar outro formato",
        review_conflicting_examples: "Revisar exemplos",
        remove_pinned_example: "Ver exemplos",
        retry_batch_commit: "Tentar novamente",
        wait_for_profile_update: "Recalculando…",
        upgrade_plan: "Em breve"
      }
    },
    confidence: "Confiança do mapa",
    confidencePanelTitle: "Confiança do mapa de voz",
    confidenceDialEyebrow: "Confiança",
    confidenceDialSubline: {
      high: "terreno mapeado",
      medium: "contornos em traço",
      low: "rotas incipientes",
      none: "mapa em branco"
    },
    confidenceLabels: {
      high: "Alta",
      medium: "Média",
      low: "Baixa",
      none: "—"
    },
    confidenceContext: {
      low: "Perfil em formação — cada novo exemplo aproxima o Cultiv do seu estilo real.",
      medium:
        "Sua voz já aparece nas gerações; exemplos em outros formatos ainda podem refiná-la.",
      high: "Sua base de exemplos é sólida. O Cultiv já adapta sua voz com segurança nas gerações.",
      none: "Adicione exemplos para o Cultiv começar a ler sua voz."
    },
    confidenceDescriptions: {
      low: "Perfil em formação: tom {tone}, com {cadence}. Com mais exemplos variados, a IA reproduz sua voz com mais segurança nas gerações.",
      medium:
        "Perfil sólido: tom {tone}, com {cadence}. A voz já aparece nas gerações, mas exemplos em outros formatos ainda podem refiná-la.",
      high: "Perfil maduro: tom {tone}, com {cadence}. Há sinais consistentes entre os textos — a IA pode adaptar sua voz com confiança em novos conteúdos."
    },
    toneLabels: {
      informal: "informal e próximo do leitor",
      formal: "formal e objetivo"
    },
    cadenceLabels: {
      direct: "frases curtas e diretas",
      balanced: "ritmo equilibrado entre concisão e detalhe",
      measured: "frases mais longas e elaboradas"
    },
    adaptationMode: "Modo de adaptação",
    adaptationModeLabels: {
      conservative: "Conservador",
      standard: "Padrão"
    },
    adaptationModeDescriptions: {
      conservative:
        "A IA prefere manter-se próxima dos exemplos e evita extrapolar quando a base ainda é limitada.",
      standard:
        "A IA aplica sua voz com mais liberdade, preservando tom e cadência nos formatos que você pedir."
    },
    confidenceAdaptationLines: {
      conservative:
        "Adaptação conservadora: o Cultiv prefere ficar bem próximo dos seus exemplos.",
      standard:
        "Adaptação equilibrada entre fidelidade aos exemplos e flexibilidade nos formatos."
    },
    diagnostics: "Diagnóstico da expedição",
    reasonCodeMessages: {
      insufficient_examples:
        "Ainda faltam textos de referência para consolidar um mapa forte e previsível. Cada novo texto aproxima o mapa do seu estilo real.",
      insufficient_diversity:
        "Já existe base suficiente, mas ainda falta diversidade de territórios e contextos para estabilizar o mapa nas gerações.",
      language_conflict:
        "Os textos misturam idiomas, o que reduz a consistência. Priorize um idioma principal ou separe textos por idioma."
    },
    diagnosticsHealthy: {
      highMultiFormat:
        "Seu mapa está bem representado e cobre mais de um território. A expedição está pronta para rotas firmes.",
      high: "Seu mapa está bem representado e pronto para adaptações mais firmes nas gerações.",
      default: "O mapa atual já é utilizável, mas ainda pode ficar mais representativo com novos textos."
    },
    coverage: "Territórios mapeados",
    coverageMissingFormats: "Ainda faltam textos nestes territórios:",
    coverageComplete:
      "Você cobriu todos os territórios recomendados. Parabéns — sua voz está bem distribuída entre os tipos de conteúdo que o Cultiv apoia.",
    underrepresented: "Territórios com poucos textos:",
    examplesTitle: "Textos de referência",
    examplesEmpty: "Nenhum texto de referência ainda.",
    examplesEmptyAction: "Adicionar texto",
    addExamples: "Adicionar textos",
    newExampleTitle: "Novo texto de referência",
    editExampleTitle: "Editar texto de referência",
    updatingBanner: "Reconstruindo seu mapa…",
    rebuildFailed: "A última reconstrução do mapa falhou.",
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
    reasoning: {
      title: "Como você navega",
      subtitle: "Padrões de observação, argumento e conclusão inferidos dos seus exemplos.",
      rebuilding: "Atualizando o raciocínio inferido a partir dos exemplos mais recentes.",
      failedKeepLast:
        "A última extração falhou, mas o raciocínio anterior continua válido. Adicione exemplos ou tente atualizar de novo.",
      coreTitle: "Raciocínio central",
      developmentTitle: "Como você traça rotas",
      developmentSubtitle: "Caminho argumentativo, postura epistêmica e movimentos típicos inferidos dos seus exemplos.",
      developmentImmature: "Com pelo menos três exemplos ativos, este espelho fica mais estável.",
      epistemicPosture: "Postura epistêmica",
      typicalMoves: "Movimentos típicos",
      developmentTraits: {
        labels: {
          openingMode: "Abertura",
          perspectiveShiftDensity: "Perspectiva",
          usesCounterexamples: "Contraexemplos",
          selfQuestioning: "Autoquestionamento",
          insightTiming: "Insight",
          usesAnalogies: "Analogias",
          closingMode: "Fechamento"
        },
        unknownGap: "Ainda não dá para inferir com os exemplos atuais.",
        authorityLinkLabel: "Validação (como penso)",
        authorityLinkAction: "Ver fonte de autoridade no bloco Como penso",
        evidenceTitle: "Evidências dos traços",
        gapsTitle: "Lacunas",
        gapsBody: "Alguns traços ainda não têm sinal suficiente nos exemplos ativos.",
        noEvidence: "Ainda não há evidências vinculadas a exemplos.",
        exampleFallback: "Exemplo",
        exampleUnavailable: "Abra a gestão de exemplos para ver o trecho completo.",
        manageExamplesLink: "Gerenciar exemplos",
        evidenceHeading: (label, value) => `Evidências — ${label}${value ? `: ${value}` : ""}`,
        exampleLabel: (contentType) => `Exemplo (${contentType})`,
        enums: {
          openingMode: { observation: "Observação", thesis: "Tese", mixed: "Misto" },
          density: { low: "Baixa", moderate: "Moderada", high: "Alta" },
          frequency: { rare: "Raro", occasional: "Ocasional", common: "Comum", dominant: "Dominante" },
          insightTiming: { early: "Cedo", moderate: "Moderado", late: "Tarde" },
          closingMode: { conclusion: "Conclusão", open_question: "Pergunta aberta", mixed: "Misto" }
        }
      },
      traitConfirmation: {
        title: "Isso combina com você?",
        yes: "Sim",
        no: "Não",
        unsure: "Não sei",
        prompts: {
          openingMode: "Você costuma abrir textos a partir de observação concreta.",
          perspectiveShiftDensity: "Você costuma mudar de perspectiva com essa frequência ao desenvolver um texto.",
          usesCounterexamples: "Você costuma usar contraexemplos com essa frequência.",
          selfQuestioning: "Você costuma questionar a própria hipótese enquanto escreve.",
          insightTiming: "Seu insight costuma aparecer tarde no desenvolvimento do texto.",
          usesAnalogies: "Você costuma raciocinar por analogias com essa frequência.",
          closingMode: "Você costuma fechar com pergunta aberta."
        }
      },
      certaintyLevel: "Nível de certeza",
      judgmentFrequency: "Frequência de julgamento",
      conclusionPace: "Ritmo de conclusão",
      readerRelationship: "Relação com o leitor",
      authoritySource: "Fonte de autoridade",
      register: "Registro",
      openingStyle: "Abertura",
      technicalDensity: "Densidade técnica",
      antiPatternsTitle: "Padrões que você evita",
      noAntiPatterns: "Nenhum padrão derivado ainda.",
      partialFormats: "Ainda não há expressão por formato suficiente (mínimo de 2 exemplos por formato).",
      refineHint: "Para refinar, adicione mais exemplos — não é possível editar estes campos manualmente.",
      enums: {
        certaintyLevel: { low: "Baixa", moderate: "Moderada", high: "Alta" },
        judgmentFrequency: { low: "Baixa", moderate: "Moderada", high: "Alta" },
        conclusionPace: { slow: "Lento", moderate: "Moderado", fast: "Rápido" },
        readerRelationship: {
          peer: "Par",
          mentor: "Mentor",
          observer: "Observador",
          collaborator: "Colaborador",
          guide: "Guia"
        },
        authoritySource: {
          personal_observation: "Observação pessoal",
          lived_experience: "Experiência vivida",
          data: "Dados",
          reference: "Referência",
          practice: "Prática"
        },
        register: {
          formal: "Formal",
          informal: "Informal",
          technical: "Técnico",
          conversational: "Conversacional"
        },
        openingStyle: {
          direct: "Direta",
          contextual: "Contextual",
          provocative: "Provocativa"
        },
        technicalDensity: { low: "Baixa", medium: "Média", high: "Alta" },
        epistemicPosture: {
          exploratory: "Exploratória",
          investigative: "Investigativa",
          advocacy_mixed: "Mista com defesa"
        }
      }
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
    step1Subtitle: "Cole 1-3 exemplos da sua escrita real. Quanto mais natural, melhor.",
    step2Title: "Pronto para criar",
    step2Subtitle: "Seu perfil de voz está sendo construído. Você já pode começar a gerar textos.",
    skip: "Pular",
    continue: "Continuar",
    goGenerate: "Começar a gerar",
    confidence: "Confiança da voz",
    credits: "Créditos disponíveis"
  },
  settings: {
    title: "Ajustes de navegação",
    subtitle: "Ajustes finos do mapa e da bússola.",
    profile: "Identidade do explorador",
    email: "Email",
    locale: "Idioma do mapa",
    localePt: "Português (Brasil)",
    localeEn: "English",
    privacy: "Apagar pegadas",
    consentActive: "Consentimento ativo",
    consentMissing: "Não concedido",
    revokeConsent: "Revogar consentimento",
    revokeDisabled: "Revogação disponível quando a API estiver publicada.",
    logout: "Sair da expedição",
    plans: "Recursos",
    saved: "Ajustes salvos."
  },
  plans: {
    title: "Recursos da jornada",
    subtitle: "Equipamento e suprimentos para sua próxima expedição.",
    currentPlan: "Equipamento atual",
    usageHint: "Seu uso do mês aparece ao gerar conteúdo.",
    changePlan: "Novos instrumentos",
    changePlanDescription: "Escolha moeda, período e forma de pagamento para assinar.",
    planPro: "Pro",
    planCriador: "Criador",
    planFree: "Gratuito",
    planFreeDescription: "Para começar a explorar com o essencial.",
    planCriadorDescription: "Para quem publica com regularidade.",
    planProDescription: "Mais cota, todos os modos e prioridade no rollout.",
    planCurrentBadge: "Atual",
    upgradeCriador: "Assinar Criador",
    upgradePro: "Assinar Pro",
    alreadyPro: "Você já está no plano Pro.",
    topUp: "Suprimentos adicionais",
    topUpDescription: "Pacote avulso de gerações extras para quando a cota do plano não for suficiente.",
    topUpCta: "Adquirir suprimentos",
    currencyLabel: "Moeda",
    currency: {
      brl: "BRL (Brasil)",
      usd: "USD"
    },
    periodLabel: "Período",
    periodMonthly: "Mensal",
    periodAnnual: "Anual (economize ~20%)",
    paymentMethodLabel: "Forma de pagamento",
    paymentCard: "Cartão",
    paymentPix: "PIX",
    pixOnlyBrl: "PIX disponível apenas para checkout em BRL.",
    annualInstallments: "Plano anual Pro parcelado em até 12x no cartão.",
    checkoutSuccess: "Pagamento recebido. Seu plano ou créditos serão atualizados em instantes.",
    checkoutCancel: "Checkout cancelado. Nenhuma cobrança foi feita.",
    checkoutError: "Não foi possível iniciar o checkout. Tente novamente.",
    redirecting: "Redirecionando…",
    loadError: "Não foi possível carregar seu plano."
  },
  notifications: {
    readyTitle: "Rota concluída. Seu texto está pronto.",
    readyAction: "Ver resultado",
    dismiss: "Dispensar"
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
      message: "Conexão perdida. Verifique sua rede e tente novamente.",
      action: "Atualizar"
    },
    default: {
      title: "Algo deu errado",
      message: "Tente novamente em instantes.",
      action: "Tentar novamente"
    }
  }
};
