export const voice = {
  pageEyebrow: "Perfil de voz · como a Cultiv aprende você",
  confidenceEyebrow: "CONFIANÇA",
  recalibrate: "Recalibrar →",
  versionLabel: (version: number, samples: string) => `versão ${version} · ${samples}`,
  proseCoreHeading: "Como eu penso",
  proseDevelopmentHeading: "Como eu desenvolvo um texto",
  proseFallback: "prosa ainda não disponível — recalibrar gera uma nova leitura.",
  errorText: "não foi possível carregar o perfil de voz.",
  emptyDescription: "sua voz aparece aqui depois da calibração",
  emptyCta: "calibrar agora →",
  loadingAriaLabel: "carregando perfil de voz",

  traits: {
    heading: "Os 7 traços da sua voz",
    hint: "confirmar ou contestar afina a voz",
    confirm: "Confere",
    contest: "Nem tanto",
    copy: {
      openingMode: {
        label: "Abertura por observação",
        desc: "prefere partir de uma cena ou tensão concreta antes da tese"
      },
      perspectiveShiftDensity: {
        label: "Densidade de reviravoltas",
        desc: "quantas vezes o argumento muda de ângulo ao longo do texto"
      },
      usesCounterexamples: {
        label: "Uso de contraexemplos",
        desc: "testa a própria tese com casos que a contradizem"
      },
      selfQuestioning: {
        label: "Autoquestionamento",
        desc: "assume a dúvida em vez de fingir certeza"
      },
      insightTiming: {
        label: "Timing do insight",
        desc: "quando a ideia central aparece — na abertura ou só no fecho"
      },
      usesAnalogies: {
        label: "Uso de analogias",
        desc: "recorre a metáforas e comparações pra explicar um ponto"
      },
      closingMode: {
        label: "Fecho do texto",
        desc: "amarra numa conclusão ou devolve a pergunta ao leitor"
      }
    },
    badge: {
      confirmed: "Confirmado",
      disputed: "Contestado",
      inferred: "Inferido"
    }
  },

  contentType: {
    "linkedin-post": "LinkedIn",
    newsletter: "Newsletter",
    "validation-post": "Post de validação",
    "architecture-post": "Post técnico",
    "long-form-blog": "Blog longo",
    "twitter-thread": "Thread"
  },

  coverage: {
    heading: "Cobertura por formato",
    empty: "cobertura ainda não calculada",
    nextStepEyebrow: "Próximo passo:",
    nextStepWeak: (contentTypeLabel: string) =>
      `sua voz ainda tem pouco fôlego em ${contentTypeLabel} — recalibrar aumenta a confiança.`,
    nextStepBalanced: "cobertura equilibrada entre os formatos calibrados."
  },

  materialBase: {
    sectionHeading: "Material-base",
    heading: (samples: string) => `${samples} da calibração · leitura`,
    footnote: "novos exemplos só entram recalibrando",
    stat: {
      total: "total",
      active: "ativos",
      excluded: "excluídos",
      pinned: "fixados"
    }
  },

  consent: {
    grantedTitle: "Consentimento de treino concedido",
    revokedTitle: "Consentimento revogado",
    grantedMeta: (sinceLabel: string) => `${sinceLabel} · seus textos são usados só pra modelar a sua voz`,
    revokedMeta: "o perfil de voz foi apagado e a geração está desligada",
    revoke: "Revogar",
    grantAgain: "Conceder de novo",
    since: (dateLabel: string) => `desde ${dateLabel}`
  },

  revokeDialog: {
    eyebrow: "ação destrutiva",
    title: "Revogar o consentimento apaga a sua voz",
    body:
      "O perfil de voz e a análise das suas amostras são apagados de forma permanente, e a geração é desligada. Seu histórico e a sua conta continuam. Pra voltar a gerar, será preciso conceder de novo e recalibrar.",
    cancel: "Manter minha voz",
    confirm: "Revogar e apagar"
  }
};
