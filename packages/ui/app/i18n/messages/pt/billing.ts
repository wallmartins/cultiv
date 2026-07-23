export const billing = {
  eyebrow: "Billing · gerir o que você tem",
  balanceUnit: "TEXTOS",
  extrato: "Extrato",
  ledgerLoading: "carregando extrato…",
  emptyLedger: "nada por aqui ainda",
  today: "hoje",
  planEyebrow: "Plano",
  switchPlan: "Trocar plano →",
  manageSubscription: "Gerenciar assinatura →",
  cancelSubscription: "Cancelar assinatura",
  confirmCancel: {
    prompt: "tem certeza?",
    confirm: "Sim, cancelar",
    keep: "Manter assinatura"
  },
  trialPlanName: "Teste grátis",
  category: {
    monthlyCredits: "Créditos do mês",
    rollover: "Acumulados",
    topup: "Compra avulsa",
    generation: "Geração",
    refund: "Estorno",
    expiration: "Expiração"
  },
  payMethod: {
    none: "sem método de pagamento ainda",
    pix: "pix · ASAAS",
    card: (last4: string) => `cartão final ${last4} · Stripe`,
    cardGeneric: "cartão · Stripe"
  },
  renew: {
    on: (date: string) => `renova em ${date}`,
    pending: "renovação pendente",
    trialEnding: (daysLabel: string) => `teste · termina em ${daysLabel}`,
    trialFree: "teste grátis",
    accessUntil: (date: string) => `acesso até ${date} · sem renovação`,
    noRenewal: "sem renovação",
    accessEnded: "acesso encerrado",
    unknown: "—"
  },
  banner: {
    trialing: {
      title: "Você está no teste grátis",
      message: (generationsLabel: string) => `${generationsLabel} restantes · qualidade cheia, o limite é só volume`,
      action: "Ver planos →"
    },
    pastDue: {
      title: "Pagamento pendente",
      message: "não conseguimos cobrar a renovação — regularize; seus créditos seguem valendo por enquanto",
      action: "Regularizar →"
    },
    canceled: {
      title: "Assinatura cancelada",
      message: "seu acesso continua até o fim do período pago; depois, o app vira paywall",
      action: "Reativar →"
    },
    lapsed: {
      title: "Assinatura encerrada",
      message: "seu acesso expirou — assine de novo para continuar gerando",
      action: "Ver planos →"
    }
  }
};
