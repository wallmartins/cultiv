import type { AppMessages } from "../types.js";

export const plans: AppMessages["plans"] = {
  perMonth: "/mo",
  generationsPerMonth: "generations/mo",
  currentPlanCta: "Current plan",
  subscribeCta: (planName) => `Subscribe to ${planName} →`,
  gateway: {
    stripe: "Stripe",
    asaas: "ASAAS"
  },
  billNote: {
    annualTotal: (amountLabel) => ` · ${amountLabel} billed yearly`
  },
  topUpPackage: (creditsLabel) => `${creditsLabel} package`,
  yourPlanFallback: "your plan",
  creditsPackageFallback: "credits package",
  redirecting: "heading to secure checkout…",
  confirming: "confirming payment…",
  planMeta: (itemLabel) => `${itemLabel} plan`,
  period: {
    monthly: "monthly",
    annual: "annual −20%"
  },
  checkout: {
    failed: {
      title: "The payment didn't go through.",
      sub: "Nothing was charged. Check your card details or try another method.",
      dismiss: "Not now",
      retry: "Try again →"
    },
    pending: {
      title: "Payment under review.",
      copy: {
        subscription:
          "Pix and boleto can take a few minutes. We'll let you know once it's confirmed — you can keep using the trial meanwhile.",
        topup:
          "Pix and boleto can take a few minutes. We'll let you know once it's confirmed — your credits land in your account right away."
      },
      done: "Back to the app →"
    },
    success: {
      subscription: {
        title: "Subscription active.",
        sub: (itemLabel) => `Welcome to ${itemLabel} — this month's credits are already in your account.`
      },
      topup: {
        title: "Credits added.",
        sub: (itemLabel) => `Your ${itemLabel} is already in your account.`
      },
      done: "Back to writing →"
    }
  },
  paywall: {
    trialExpired: {
      title: "Your trial has ended.",
      sub: "That's the 5 generations from the trial period. Your voice is still ready — pick a plan to keep writing."
    },
    usageRestricted: {
      title: "You've hit your plan's limit.",
      sub: "Generations renew next cycle — or upgrade and keep going right now."
    },
    lowBalance: {
      title: "Your credits are running low.",
      sub: (textsLabel) => `~${textsLabel} left. Secure continuity before you run out.`
    },
    calibrationLimit: {
      title: "You've hit your recalibration limit.",
      sub: "Bigger plans include more recalibrations per month — your voice will thank you."
    }
  },
  catalogError: "couldn't load plans right now",
  topUpLink: "need just a few credits? one-time purchase →",
  trialBanner: (used, totalGenerations, remaining, daysLabel) =>
    `${used} of ${totalGenerations} generations used · ${remaining} left · ${daysLabel}`,
  heading: {
    prefix: "Choose the pace of your ",
    emphasis: "voice",
    suffix: "."
  }
};
