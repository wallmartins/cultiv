import { useEffect, useState } from "react";
import { useSearch } from "@tanstack/react-router";
import { Button, CoordinateLabel, LogbookProse, Text } from "@my-ai-orchestrator/ui";
import type { BillingCheckoutPeriod, BillingCurrency, BillingPaymentMethod } from "@my-ai-orchestrator/contracts";
import { useAppLocale } from "~/i18n/app/use-app-locale";
import { useClientSdk } from "~/platform/runtime/client-sdk-context";

type CheckoutStatus = "success" | "cancel" | undefined;

function ToggleButton(props: { readonly active: boolean; readonly label: string; readonly onClick: () => void }) {
  return (
    <button
      type="button"
      className={
        props.active
          ? "rounded-full border border-terracotta/40 bg-terracotta/10 px-4 py-1.5 font-inter text-sm font-medium text-terracotta"
          : "rounded-full border border-dotted-cartography px-4 py-1.5 font-inter text-sm text-ink-muted transition-colors hover:border-terracotta/25 hover:text-ink"
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
  features,
  isCurrent,
  cta,
  onCta,
  loading
}: {
  readonly name: string;
  readonly description: string;
  readonly features: readonly string[];
  readonly isCurrent: boolean;
  readonly cta: string;
  readonly onCta: () => void;
  readonly loading: boolean;
}) {
  return (
    <LogbookProse className="space-y-4 p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <Text as="h3" variant="label" className="font-playfair text-lg text-ink">
            {name}
          </Text>
          <Text variant="meta" className="mt-1 text-ink-muted">
            {description}
          </Text>
        </div>
        {isCurrent ? (
          <span className="shrink-0 rounded-[5px] border border-terracotta/30 bg-terracotta/10 px-2 py-0.5 font-inter text-[0.65rem] font-semibold uppercase tracking-wider text-terracotta">
            Atual
          </span>
        ) : null}
      </div>

      <ul className="space-y-2">
        {features.map((feature, index) => (
          <li key={index} className="flex items-start gap-2">
            <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-moss" aria-hidden />
            <span className="font-inter text-sm text-ink-muted">{feature}</span>
          </li>
        ))}
      </ul>

      {!isCurrent ? (
        <Button type="button" disabled={loading} onClick={onCta} className="w-full sm:w-auto">
          {loading ? "…" : cta}
        </Button>
      ) : null}
    </LogbookProse>
  );
}

export function PlansScreen() {
  const { messages } = useAppLocale();
  const client = useClientSdk();
  const search = useSearch({ strict: false }) as { status?: CheckoutStatus };
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
    period: BillingCheckoutPeriod
  ): Promise<void> {
    setCheckoutError(false);
    setLoadingCheckout(
      productKind === "topup" ? "topup" : internalRef === "criador" ? "criador" : "pro"
    );

    try {
      const result = await client.toPromise(
        client.billing.createCheckout({
          productKind,
          internalRef,
          currency,
          billingPeriod: period,
          ...(currency === "BRL" ? { paymentMethod } : {})
        })
      );
      window.location.href = result.url;
    } catch {
      setCheckoutError(true);
      setLoadingCheckout(null);
    }
  }

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

  const freeFeatures = [
    "Acesso à plataforma",
    "Mapa de voz básico",
    "Todos os objetivos de escrita",
    "Modo rápido de geração",
    "Prévia antes de gerar"
  ];

  const creatorFeatures = [
    "Tudo do Gratuito",
    "Mais gerações por mês",
    "Modos rápido e equilibrado",
    "Perfil de voz mais robusto",
    "Suporte a textos de médio e longo alcance"
  ];

  const proFeatures = [
    "Tudo do Criador",
    "Cota bem mais generosa de gerações",
    "Todos os modos de geração",
    "Acesso antecipado a novidades",
    "Prioridade no rollout"
  ];

  return (
    <div className="mx-auto max-w-3xl space-y-6 px-[var(--spacing-gutter)] py-8 md:py-10">
      <div>
        <Text as="h1" variant="h1" className="mb-2 font-playfair text-ink">
          {messages.plans.title}
        </Text>
        <Text variant="body" className="text-ink-muted">
          {messages.plans.subtitle}
        </Text>
      </div>

      {statusBanner ? (
        <LogbookProse className="border-terracotta/30 bg-terracotta/5 p-4">
          <Text variant="body" className="text-terracotta">{statusBanner}</Text>
        </LogbookProse>
      ) : null}

      {checkoutError ? (
        <LogbookProse className="border-red-700/30 bg-red-700/5 p-4">
          <Text variant="meta" className="text-terracotta">
            {messages.plans.checkoutError}
          </Text>
        </LogbookProse>
      ) : null}

      <LogbookProse className="space-y-4 border-terracotta/40 p-5">
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
      </LogbookProse>

      <LogbookProse className="space-y-5 p-5">
        <CoordinateLabel index={2} label={messages.plans.changePlan} className="block" />
        <Text variant="meta" className="text-ink-muted">
          {messages.plans.changePlanDescription}
        </Text>

        <div className="space-y-4 border-t border-dotted-cartography pt-4">
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

        <div className="grid gap-4 border-t border-dotted-cartography pt-4 lg:grid-cols-3">
          <PlanCard
            name={messages.plans.planFree}
            description="Equipamento básico para começar a explorar."
            features={freeFeatures}
            isCurrent={!isPro && !isCriador}
            cta={messages.plans.upgradeCriador}
            onCta={() => void startCheckout("subscription", "criador", billingPeriod)}
            loading={loadingCheckout === "criador"}
          />
          <PlanCard
            name={messages.plans.planCriador}
            description="Para quem publica com regularidade."
            features={creatorFeatures}
            isCurrent={isCriador}
            cta={messages.plans.upgradePro}
            onCta={() => void startCheckout("subscription", "pro", billingPeriod)}
            loading={loadingCheckout === "pro"}
          />
          <PlanCard
            name={messages.plans.planPro}
            description="O máximo de controle e qualidade."
            features={proFeatures}
            isCurrent={isPro}
            cta={messages.plans.upgradePro}
            onCta={() => void startCheckout("subscription", "pro", billingPeriod)}
            loading={loadingCheckout === "pro"}
          />
        </div>
      </LogbookProse>

      <LogbookProse className="space-y-4 p-5">
        <CoordinateLabel index={3} label={messages.plans.topUp} className="block" />
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <Text variant="label" className="mb-1 block font-playfair text-ink">
              Suprimentos de geração
            </Text>
            <Text variant="meta" className="text-ink-muted">
              {messages.plans.topUpDescription}
            </Text>
          </div>
          <Button
            type="button"
            variant="ghost"
            disabled={loadingCheckout !== null}
            onClick={() => void startCheckout("topup", "topup_500", "one_time")}
          >
            {loadingCheckout === "topup" ? messages.plans.redirecting : messages.plans.topUpCta}
          </Button>
        </div>
      </LogbookProse>
    </div>
  );
}
