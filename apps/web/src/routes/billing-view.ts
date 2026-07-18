import type { BillingEntitlementView, BillingPlanView, LedgerStatementRow } from "@my-ai-orchestrator/contracts";
import type { LedgerRowData, LedgerRowTone, SubscriptionBannerTone } from "@my-ai-orchestrator/ui/app/billing";

export type SubscriptionState = "trialing" | "active" | "past_due" | "canceled" | "lapsed";

export interface SubscriptionBannerCopy {
  readonly tone: SubscriptionBannerTone;
  readonly title: string;
  readonly message: string;
  readonly actionLabel: string;
}

export interface SubscriptionView {
  readonly state: SubscriptionState;
  readonly renewLabel: string;
  readonly payMethod: string;
  // undefined only for "active" — the one state with no banner ("ativo limpo").
  readonly banner?: SubscriptionBannerCopy;
}

function formatDayMonth(iso: string): string {
  const date = new Date(iso);
  return `${String(date.getUTCDate()).padStart(2, "0")}/${String(date.getUTCMonth() + 1).padStart(2, "0")}`;
}

function sameUtcDay(a: Date, b: Date): boolean {
  return (
    a.getUTCFullYear() === b.getUTCFullYear() &&
    a.getUTCMonth() === b.getUTCMonth() &&
    a.getUTCDate() === b.getUTCDate()
  );
}

function daysUntil(iso: string, now: Date): number {
  return Math.max(0, Math.ceil((new Date(iso).getTime() - now.getTime()) / 86_400_000));
}

// paymentMethod is real, server-resolved data (unlike the currency-based guess the breakdown
// doc assumed before this contract existed) — trial has none, gateway drives the copy.
function derivePayMethod(entitlement: BillingEntitlementView): string {
  const method = entitlement.paymentMethod;
  if (!method) return "sem método de pagamento ainda";
  if (method.kind === "pix") return "pix · ASAAS";
  return method.brandLast4 ? `cartão final ${method.brandLast4} · Stripe` : "cartão · Stripe";
}

export function deriveSubscriptionState(entitlement: BillingEntitlementView, now: Date): SubscriptionView {
  const payMethod = derivePayMethod(entitlement);

  switch (entitlement.status) {
    case "trialing":
      return {
        state: "trialing",
        renewLabel: entitlement.trialEndsAt
          ? `teste · termina em ${daysUntil(entitlement.trialEndsAt, now)} dias`
          : "teste grátis",
        payMethod,
        banner: {
          tone: "accent",
          title: "Você está no teste grátis",
          message: `${entitlement.quotaRemaining} gerações restantes · qualidade cheia, o limite é só volume`,
          actionLabel: "Ver planos →"
        }
      };
    case "past_due":
      return {
        state: "past_due",
        renewLabel: entitlement.renewsAt ? `renova em ${formatDayMonth(entitlement.renewsAt)}` : "renovação pendente",
        payMethod,
        banner: {
          tone: "danger",
          title: "Pagamento pendente",
          message: "não conseguimos cobrar a renovação — regularize; seus créditos seguem valendo por enquanto",
          actionLabel: "Regularizar →"
        }
      };
    case "canceled":
      return {
        state: "canceled",
        renewLabel: entitlement.accessUntil
          ? `acesso até ${formatDayMonth(entitlement.accessUntil)} · sem renovação`
          : "sem renovação",
        payMethod,
        banner: {
          tone: "neutral",
          title: "Assinatura cancelada",
          message: "seu acesso continua até o fim do período pago; depois, o app vira paywall",
          actionLabel: "Reativar →"
        }
      };
    case "lapsed":
      // 5º status do contrato real, fora do escopo dos 4 estados do breakdown (ticket 13) — trato
      // aqui só o mínimo pra não quebrar o switch; S10 é dono do polish desse edge state.
      return {
        state: "lapsed",
        renewLabel: "acesso encerrado",
        payMethod,
        banner: {
          tone: "neutral",
          title: "Assinatura encerrada",
          message: "seu acesso expirou — assine de novo para continuar gerando",
          actionLabel: "Ver planos →"
        }
      };
    default:
      return {
        state: "active",
        renewLabel: entitlement.renewsAt ? `renova em ${formatDayMonth(entitlement.renewsAt)}` : "—",
        payMethod
      };
  }
}

const TRIAL_PLAN_NAME = "Teste grátis";

// BillingEntitlementView has no human-readable plan name (only planId/tier) — resolved against
// the catalog when available, falling back to the tier id so the card never renders blank.
export function resolvePlanName(entitlement: BillingEntitlementView, plans: readonly BillingPlanView[] | undefined): string {
  if (entitlement.status === "trialing") return TRIAL_PLAN_NAME;
  const catalogPlan = plans?.find((plan) => plan.id === entitlement.planId);
  if (catalogPlan) return catalogPlan.name;
  return entitlement.tier.charAt(0).toUpperCase() + entitlement.tier.slice(1);
}

// 1d — "os N créditos do ciclo" (PaymentPendingZeroCredits): the plan's real monthly grant when
// the catalog is loaded, falling back to the entitlement's own remaining-this-cycle field.
export function resolveCycleCredits(entitlement: BillingEntitlementView, plans: readonly BillingPlanView[] | undefined): number {
  const catalogPlan = plans?.find((plan) => plan.id === entitlement.planId);
  return catalogPlan?.monthlyCredits ?? entitlement.monthlyCreditsRemaining;
}

const CATEGORY_LABEL: Record<LedgerStatementRow["category"], string> = {
  monthly_credits: "Créditos do mês",
  rollover: "Acumulados",
  topup: "Compra avulsa",
  generation: "Geração",
  refund: "Estorno",
  expiration: "Expiração"
};

const CATEGORY_TONE: Record<LedgerStatementRow["category"], LedgerRowTone> = {
  monthly_credits: "credit",
  rollover: "credit",
  topup: "credit",
  generation: "debit",
  refund: "credit",
  expiration: "expire"
};

function formatLedgerDate(iso: string, now: Date): string {
  return sameUtcDay(new Date(iso), now) ? "hoje" : formatDayMonth(iso);
}

function formatLedgerAmount(creditsDelta: number): string {
  return creditsDelta > 0 ? `+${creditsDelta}` : `${creditsDelta}`;
}

function ledgerLabel(row: LedgerStatementRow): string {
  if (row.category === "monthly_credits" && row.planName) return `${CATEGORY_LABEL[row.category]} (${row.planName})`;
  return CATEGORY_LABEL[row.category];
}

function ledgerSub(row: LedgerStatementRow): string | undefined {
  if (row.category === "generation" && row.topic) return `"${row.topic}"`;
  return row.note;
}

// Rows already arrive curated by the backend (LedgerStatementView collapses reserve/capture/release
// server-side) — this only formats display strings, it never re-curates raw ledger entries.
export function buildLedgerRows(rows: readonly LedgerStatementRow[], now: Date): readonly LedgerRowData[] {
  return rows.map((row) => ({
    id: row.id,
    amount: formatLedgerAmount(row.creditsDelta),
    tone: CATEGORY_TONE[row.category],
    label: ledgerLabel(row),
    sub: ledgerSub(row),
    date: formatLedgerDate(row.occurredAt, now)
  }));
}
