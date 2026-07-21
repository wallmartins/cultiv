export const plans = {
  perMonth: "/mês",
  generationsPerMonth: "gerações/mês",
  currentPlanCta: "Plano atual",
  subscribeCta: (planName: string) => `Assinar ${planName} →`,
  gateway: {
    stripe: "Stripe",
    asaas: "ASAAS"
  },
  billNote: {
    annualTotal: (amountLabel: string) => ` · ${amountLabel} cobrado no ano`
  },
  topUpPackage: (creditsLabel: string) => `pacote de ${creditsLabel}`,
  yourPlanFallback: "seu plano",
  creditsPackageFallback: "pacote de créditos",
  redirecting: "indo pro pagamento seguro…",
  confirming: "confirmando pagamento…",
  planMeta: (itemLabel: string) => `plano ${itemLabel}`,
  period: {
    monthly: "mensal",
    annual: "anual −20%"
  },
  checkout: {
    failed: {
      title: "O pagamento não passou.",
      sub: "Nada foi cobrado. Confira os dados do cartão ou tente outro método.",
      dismiss: "Agora não",
      retry: "Tentar de novo →"
    },
    pending: {
      title: "Pagamento em análise.",
      copy: {
        subscription:
          "Pix e boleto podem levar alguns minutos. Avisamos assim que confirmar — pode continuar usando o teste.",
        topup:
          "Pix e boleto podem levar alguns minutos. Avisamos assim que confirmar — seus créditos entram na conta na hora."
      },
      done: "Voltar ao app →"
    },
    success: {
      subscription: {
        title: "Assinatura ativa.",
        sub: (itemLabel: string) => `Bem-vindo ao ${itemLabel} — seus créditos do mês já estão na conta.`
      },
      topup: {
        title: "Créditos adicionados.",
        sub: (itemLabel: string) => `Seu ${itemLabel} já está na conta.`
      },
      done: "Voltar a escrever →"
    }
  },
  paywall: {
    trialExpired: {
      title: "Seu teste terminou.",
      sub: "Foram as 5 gerações do período de teste. Sua voz continua pronta — escolha um plano pra seguir escrevendo."
    },
    usageRestricted: {
      title: "Você atingiu o limite do seu plano.",
      sub: "As gerações renovam no próximo ciclo — ou suba de plano e continue agora."
    },
    lowBalance: {
      title: "Seus créditos estão acabando.",
      sub: (textsLabel: string) => `Restam ~${textsLabel}. Garanta a continuidade antes de faltar.`
    },
    calibrationLimit: {
      title: "Você atingiu o limite de recalibrações.",
      sub: "Planos maiores incluem mais recalibrações por mês — sua voz agradece."
    }
  },
  catalogError: "não foi possível carregar os planos agora",
  topUpLink: "precisa de poucos créditos? compra avulsa →",
  trialBanner: (used: number, totalGenerations: number, remaining: number, daysLabel: string) =>
    `${used} de ${totalGenerations} gerações usadas · ${remaining} restantes · ${daysLabel}`,
  heading: {
    prefix: "Escolha o ritmo da sua ",
    emphasis: "voz",
    suffix: "."
  }
};
