import { useEffect, useRef, useState } from "react";
import { useSearch } from "@tanstack/react-router";
import { Button, CoordinateLabel, Text } from "@my-ai-orchestrator/ui";
import type { BillingCheckoutPeriod, BillingCurrency, BillingPaymentMethod } from "@my-ai-orchestrator/contracts";
import { useAppLocale } from "~/i18n/app/use-app-locale";
import { useClientSdk } from "~/platform/runtime/client-sdk-context";
import { AppCard } from "~/platform/ui/AppCard";

function ToggleButton(props: { readonly active: boolean; readonly label: string; readonly onClick: () => void }) {
  return (
    <button
      type="button"
      className={
        props.active
          ? "rounded-full border border-terracotta/40 bg-terracotta/10 px-4 py-1.5 font-inter text-sm font-medium text-terracotta"
          : "rounded-full border border-ink-ghost/40 px-4 py-1.5 font-inter text-sm text-ink-muted transition-colors hover:border-terracotta/25 hover:text-ink"
      }
      aria-pressed={props.active}
      onClick={props.onClick}
    >
      {props.label}
    </button>
  );
}

function PlanCard({
  name,
  description,
  isCurrent,
  cta,
  onCta,
  loading,
  currentLabel
}: {
  readonly name: string;
  readonly description: string;
  readonly isCurrent: boolean;
  readonly cta: string;
  readonly onCta: () => void;
  readonly loading: boolean;
  readonly currentLabel: string;
}) {
  return (
    <AppCard className="flex h-full flex-col justify-between gap-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <Text as="h3" variant="label" className="font-playfair text-lg text-ink">
            {name}
          </Text>
          <Text variant="meta" className="mt-2 text-ink-muted">
            {description}
          </Text>
        </div>
        {isCurrent ? (
          <span className="shrink-0 rounded-[5px] border border-terracotta/30 bg-terracotta/10 px-2 py-0.5 font-inter text-[0.65rem] font-semibold uppercase tracking-wider text-terracotta">
            {currentLabel}
          </span>
        ) : null}
      </div>

      {!isCurrent ? (
        <Button type="button" disabled={loading} onClick={onCta} className="w-full sm:w-auto">
          {loading ? "…" : cta}
        </Button>
      ) : null}
    </AppCard>
  );
}

export function PlansScreen() {
  const { messages } = useAppLocale();
  const client = useClientSdk();
  const search = useSearch({ from: "/app/plans" });
  const autoCheckoutStarted = useRef(false);
  const [currency, setCurrency] = useState<BillingCurrency>("BRL");
  const [billingPeriod, setBillingPeriod] = useState<Exclude<BillingCheckoutPeriod, "one_time">>("monthly");
  const [paymentMethod, setPaymentMethod] = useState<BillingPaymentMethod>("card");
  const [entitlement, setEntitlement] = useState<{
    readonly planId: string;
    readonly tier: string;
    readonly status: string;
  } | null>(null);
  const [loadError, setLoadError] = useState(false);
  const [checkoutError, setCheckoutError] = useState(false);
  const [loadingCheckout, setLoadingCheckout] = useState<"pro" | "criador" | "topup" | null>(null);

  useEffect(() => {
    let cancelled = false;

    void client.toPromise(client.billing.getEntitlement()).then(
      (value) => {
        if (!cancelled) {
          setEntitlement(value);
          setLoadError(false);
        }
      },
      () => {
        if (!cancelled) {
          setLoadError(true);
        }
      }
    );

    return () => {
      cancelled = true;
    };
  }, [client]);

  async function startCheckout(
    productKind: "subscription" | "topup",
    internalRef: string,
    period: BillingCheckoutPeriod,
    currencyOverride?: BillingCurrency
  ): Promise<void> {
    const checkoutCurrency = currencyOverride ?? currency;
    setCheckoutError(false);
    setLoadingCheckout(
      productKind === "topup" ? "topup" : internalRef === "criador" ? "criador" : "pro"
    );

    try {
      const result = await client.toPromise(
        client.billing.createCheckout({
          productKind,
          internalRef,
          currency: checkoutCurrency,
          billingPeriod: period,
          ...(checkoutCurrency === "BRL" ? { paymentMethod } : {})
        })
      );
      window.location.href = result.url;
    } catch {
      setCheckoutError(true);
      setLoadingCheckout(null);
    }
  }

  useEffect(() => {
    if (!search.checkout || !entitlement || autoCheckoutStarted.current) {
      return;
    }

    const targetTier = search.checkout === "criador" ? "starter" : "pro";
    const alreadyOnPlan = entitlement.tier === targetTier && entitlement.status === "active";

    if (alreadyOnPlan) {
      return;
    }

    autoCheckoutStarted.current = true;
    const checkoutCurrency = search.currency ?? currency;
    const checkoutPeriod = search.period ?? billingPeriod;
    void startCheckout("subscription", search.checkout, checkoutPeriod, checkoutCurrency);
  }, [entitlement, search.checkout, search.currency, search.period, currency, billingPeriod]);

  const isPro = entitlement?.tier === "pro" && entitlement.status === "active";
  const isCriador = entitlement?.tier === "starter" && entitlement.status === "active";
  const currentPlanLabel =
    entitlement?.tier === "pro"
      ? messages.plans.planPro
      : entitlement?.tier === "starter"
        ? messages.plans.planCriador
        : messages.plans.planFree;
  const statusBanner =
    search.status === "success"
      ? messages.plans.checkoutSuccess
      : search.status === "cancel"
        ? messages.plans.checkoutCancel
        : null;

  return (
    <div className="mx-auto max-w-6xl space-y-6 px-[var(--spacing-gutter)] py-8 md:py-10">
      <div>
        <Text as="h1" variant="h1" className="mb-2 font-playfair text-ink">
          {messages.plans.title}
        </Text>
        <Text variant="body" className="text-ink-muted">
          {messages.plans.subtitle}
        </Text>
      </div>

      {statusBanner ? (
        <AppCard className="border-terracotta/30 bg-terracotta/5">
          <Text variant="body" className="text-terracotta">{statusBanner}</Text>
        </AppCard>
      ) : null}

      {checkoutError ? (
        <AppCard className="border-red-700/30 bg-red-700/5">
          <Text variant="meta" className="text-terracotta">
            {messages.plans.checkoutError}
          </Text>
        </AppCard>
      ) : null}

      <AppCard className="space-y-4 border-terracotta/25">
        <CoordinateLabel index={1} label={messages.plans.currentPlan} className="block" />
        {loadError ? (
          <Text variant="meta" className="text-terracotta">
            {messages.plans.loadError}
          </Text>
        ) : entitlement ? (
          <div>
            <Text variant="label" className="font-playfair text-lg text-ink">
              {currentPlanLabel}
            </Text>
            <Text variant="meta" className="mt-1 text-ink-muted">
              {messages.plans.usageHint}
            </Text>
          </div>
        ) : (
          <Text variant="meta" className="text-ink-muted">…</Text>
        )}
      </AppCard>

      <AppCard className="space-y-6">
        <div className="space-y-2">
          <CoordinateLabel index={2} label={messages.plans.changePlan} className="block" />
          <Text variant="meta" className="text-ink-muted">
            {messages.plans.changePlanDescription}
          </Text>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          <div>
            <Text variant="label" className="mb-3 block font-inter text-xs font-semibold uppercase tracking-wider text-ink-muted">
              {messages.plans.currencyLabel}
            </Text>
            <div className="flex flex-wrap gap-2">
              <ToggleButton
                active={currency === "BRL"}
                label={messages.plans.currency.brl}
                onClick={() => setCurrency("BRL")}
              />
              <ToggleButton
                active={currency === "USD"}
                label={messages.plans.currency.usd}
                onClick={() => {
                  setCurrency("USD");
                  setPaymentMethod("card");
                }}
              />
            </div>
          </div>

          <div>
            <Text variant="label" className="mb-3 block font-inter text-xs font-semibold uppercase tracking-wider text-ink-muted">
              {messages.plans.periodLabel}
            </Text>
            <div className="flex flex-wrap gap-2">
              <ToggleButton
                active={billingPeriod === "monthly"}
                label={messages.plans.periodMonthly}
                onClick={() => setBillingPeriod("monthly")}
              />
              <ToggleButton
                active={billingPeriod === "annual"}
                label={messages.plans.periodAnnual}
                onClick={() => setBillingPeriod("annual")}
              />
            </div>
          </div>

          {currency === "BRL" ? (
            <div>
              <Text variant="label" className="mb-3 block font-inter text-xs font-semibold uppercase tracking-wider text-ink-muted">
                {messages.plans.paymentMethodLabel}
              </Text>
              <div className="flex flex-wrap gap-2">
                <ToggleButton
                  active={paymentMethod === "card"}
                  label={messages.plans.paymentCard}
                  onClick={() => setPaymentMethod("card")}
                />
                <ToggleButton
                  active={paymentMethod === "pix"}
                  label={messages.plans.paymentPix}
                  onClick={() => setPaymentMethod("pix")}
                />
              </div>
              {paymentMethod === "pix" ? (
                <Text variant="meta" className="mt-3 text-ink-muted">
                  {messages.plans.pixOnlyBrl}
                </Text>
              ) : billingPeriod === "annual" ? (
                <Text variant="meta" className="mt-3 text-ink-muted">
                  {messages.plans.annualInstallments}
                </Text>
              ) : null}
            </div>
          ) : null}
        </div>

        <div className="grid gap-4 lg:grid-cols-3">
          <PlanCard
            name={messages.plans.planFree}
            description={messages.plans.planFreeDescription}
            isCurrent={!isPro && !isCriador}
            cta={messages.plans.upgradeCriador}
            onCta={() => void startCheckout("subscription", "criador", billingPeriod)}
            loading={loadingCheckout === "criador"}
            currentLabel={messages.plans.planCurrentBadge}
          />
          <PlanCard
            name={messages.plans.planCriador}
            description={messages.plans.planCriadorDescription}
            isCurrent={isCriador}
            cta={messages.plans.upgradePro}
            onCta={() => void startCheckout("subscription", "pro", billingPeriod)}
            loading={loadingCheckout === "pro"}
            currentLabel={messages.plans.planCurrentBadge}
          />
          <PlanCard
            name={messages.plans.planPro}
            description={messages.plans.planProDescription}
            isCurrent={isPro}
            cta={messages.plans.upgradePro}
            onCta={() => void startCheckout("subscription", "pro", billingPeriod)}
            loading={loadingCheckout === "pro"}
            currentLabel={messages.plans.planCurrentBadge}
          />
        </div>
      </AppCard>

      <AppCard className="space-y-4">
        <CoordinateLabel index={3} label={messages.plans.topUp} className="block" />
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <Text variant="meta" className="max-w-xl text-ink-muted">
            {messages.plans.topUpDescription}
          </Text>
          <Button
            type="button"
            variant="ghost"
            disabled={loadingCheckout !== null}
            onClick={() => void startCheckout("topup", "topup_500", "one_time")}
          >
            {loadingCheckout === "topup" ? messages.plans.redirecting : messages.plans.topUpCta}
          </Button>
        </div>
      </AppCard>
    </div>
  );
}
