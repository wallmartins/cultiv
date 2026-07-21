import type { AppMessages } from "../types.js";

export const billing: AppMessages["billing"] = {
  eyebrow: "Billing · manage what you have",
  balanceUnit: "TEXTS",
  extrato: "Statement",
  ledgerLoading: "loading statement…",
  emptyLedger: "nothing here yet",
  today: "today",
  planEyebrow: "Plan",
  switchPlan: "Switch plan →",
  manageSubscription: "Manage subscription →",
  cancelSubscription: "Cancel subscription",
  confirmCancel: {
    prompt: "are you sure?",
    confirm: "Yes, cancel",
    keep: "Keep subscription"
  },
  trialPlanName: "Free trial",
  category: {
    monthlyCredits: "Monthly credits",
    rollover: "Rolled over",
    topup: "One-time purchase",
    generation: "Generation",
    refund: "Refund",
    expiration: "Expired"
  },
  payMethod: {
    none: "no payment method yet",
    pix: "pix · ASAAS",
    card: (last4) => `card ending in ${last4} · Stripe`,
    cardGeneric: "card · Stripe"
  },
  renew: {
    on: (date) => `renews on ${date}`,
    pending: "renewal pending",
    trialEnding: (daysLabel) => `trial · ends in ${daysLabel}`,
    trialFree: "free trial",
    accessUntil: (date) => `access until ${date} · no renewal`,
    noRenewal: "no renewal",
    accessEnded: "access ended",
    unknown: "—"
  },
  banner: {
    trialing: {
      title: "You're on the free trial",
      message: (generationsLabel) => `${generationsLabel} left · full quality, only volume is capped`,
      action: "See plans →"
    },
    pastDue: {
      title: "Payment pending",
      message: "we couldn't charge your renewal — please regularize; your credits are still valid for now",
      action: "Regularize →"
    },
    canceled: {
      title: "Subscription canceled",
      message: "your access continues until the end of the paid period; after that, the app becomes a paywall",
      action: "Reactivate →"
    },
    lapsed: {
      title: "Subscription ended",
      message: "your access expired — subscribe again to keep generating",
      action: "See plans →"
    }
  }
};
