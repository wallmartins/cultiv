import type { BillingEntitlementView, BillingPlanView, LedgerStatementRow } from "@my-ai-orchestrator/contracts";
import type { AppFormatters, AppMessages } from "@my-ai-orchestrator/ui/app/i18n";
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
function derivePayMethod(t: AppMessages, entitlement: BillingEntitlementView): string {
  const method = entitlement.paymentMethod;
  if (!method) return t.billing.payMethod.none;
  if (method.kind === "pix") return t.billing.payMethod.pix;
  return method.brandLast4 ? t.billing.payMethod.card(method.brandLast4) : t.billing.payMethod.cardGeneric;
}

export function deriveSubscriptionState(
  t: AppMessages,
  format: AppFormatters,
  entitlement: BillingEntitlementView,
  now: Date
): SubscriptionView {
  const payMethod = derivePayMethod(t, entitlement);

  switch (entitlement.status) {
    case "trialing":
      return {
        state: "trialing",
        renewLabel: entitlement.trialEndsAt
          ? t.billing.renew.trialEnding(t.common.days(daysUntil(entitlement.trialEndsAt, now)))
          : t.billing.renew.trialFree,
        payMethod,
        banner: {
          tone: "accent",
          title: t.billing.banner.trialing.title,
          message: t.billing.banner.trialing.message(t.common.generations(entitlement.quotaRemaining)),
          actionLabel: t.billing.banner.trialing.action
        }
      };
    case "past_due":
      return {
        state: "past_due",
        renewLabel: entitlement.renewsAt ? t.billing.renew.on(format.date(entitlement.renewsAt)) : t.billing.renew.pending,
        payMethod,
        banner: {
          tone: "danger",
          title: t.billing.banner.pastDue.title,
          message: t.billing.banner.pastDue.message,
          actionLabel: t.billing.banner.pastDue.action
        }
      };
    case "canceled":
      return {
        state: "canceled",
        renewLabel: entitlement.accessUntil
          ? t.billing.renew.accessUntil(format.date(entitlement.accessUntil))
          : t.billing.renew.noRenewal,
        payMethod,
        banner: {
          tone: "neutral",
          title: t.billing.banner.canceled.title,
          message: t.billing.banner.canceled.message,
          actionLabel: t.billing.banner.canceled.action
        }
      };
    case "lapsed":
      // 5º status do contrato real, fora do escopo dos 4 estados do breakdown (ticket 13) — trato
      // aqui só o mínimo pra não quebrar o switch; S10 é dono do polish desse edge state.
      return {
        state: "lapsed",
        renewLabel: t.billing.renew.accessEnded,
        payMethod,
        banner: {
          tone: "neutral",
          title: t.billing.banner.lapsed.title,
          message: t.billing.banner.lapsed.message,
          actionLabel: t.billing.banner.lapsed.action
        }
      };
    default:
      return {
        state: "active",
        renewLabel: entitlement.renewsAt ? t.billing.renew.on(format.date(entitlement.renewsAt)) : t.billing.renew.unknown,
        payMethod
      };
  }
}

// BillingEntitlementView has no human-readable plan name (only planId/tier) — resolved against
// the catalog when available, falling back to the tier id so the card never renders blank.
export function resolvePlanName(
  t: AppMessages,
  entitlement: BillingEntitlementView,
  plans: readonly BillingPlanView[] | undefined
): string {
  if (entitlement.status === "trialing") return t.billing.trialPlanName;
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

function categoryLabel(t: AppMessages, category: LedgerStatementRow["category"]): string {
  const map: Record<LedgerStatementRow["category"], string> = {
    monthly_credits: t.billing.category.monthlyCredits,
    rollover: t.billing.category.rollover,
    topup: t.billing.category.topup,
    generation: t.billing.category.generation,
    refund: t.billing.category.refund,
    expiration: t.billing.category.expiration
  };
  return map[category];
}

const CATEGORY_TONE: Record<LedgerStatementRow["category"], LedgerRowTone> = {
  monthly_credits: "credit",
  rollover: "credit",
  topup: "credit",
  generation: "debit",
  refund: "credit",
  expiration: "expire"
};

function formatLedgerDate(t: AppMessages, format: AppFormatters, iso: string, now: Date): string {
  return sameUtcDay(new Date(iso), now) ? t.billing.today : format.date(iso);
}

function formatLedgerAmount(creditsDelta: number): string {
  return creditsDelta > 0 ? `+${creditsDelta}` : `${creditsDelta}`;
}

function ledgerLabel(t: AppMessages, row: LedgerStatementRow): string {
  if (row.category === "monthly_credits" && row.planName) return `${categoryLabel(t, row.category)} (${row.planName})`;
  return categoryLabel(t, row.category);
}

function ledgerSub(row: LedgerStatementRow): string | undefined {
  if (row.category === "generation" && row.topic) return `"${row.topic}"`;
  return row.note;
}

// Rows already arrive curated by the backend (LedgerStatementView collapses reserve/capture/release
// server-side) — this only formats display strings, it never re-curates raw ledger entries.
export function buildLedgerRows(
  t: AppMessages,
  format: AppFormatters,
  rows: readonly LedgerStatementRow[],
  now: Date
): readonly LedgerRowData[] {
  return rows.map((row) => ({
    id: row.id,
    amount: formatLedgerAmount(row.creditsDelta),
    tone: CATEGORY_TONE[row.category],
    label: ledgerLabel(t, row),
    sub: ledgerSub(row),
    date: formatLedgerDate(t, format, row.occurredAt, now)
  }));
}
