import { useEffect, useState } from "react";
import { useSearch } from "@tanstack/react-router";
import { Button, Container, Text } from "@my-ai-orchestrator/ui";
import type { BillingCheckoutPeriod, BillingCurrency, BillingPaymentMethod } from "@my-ai-orchestrator/contracts";
import { useAppLocale } from "~/i18n/app/use-app-locale";
import { useClientSdk } from "~/platform/runtime/client-sdk-context";
import { AppCard } from "~/platform/ui/AppCard";

type CheckoutStatus = "success" | "cancel" | undefined;

function SectionLabel({ children }: { readonly children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3 mb-4">
      <div className="h-px flex-1 bg-terracota/15" />
      <span className="font-inter text-[0.65rem] font-semibold uppercase tracking-[0.15em] text-terracota/70">
        {children}
      </span>
      <div className="h-px flex-1 bg-terracota/15" />
    </div>
  );
}

function PlanCard({
  name,
  description,
  features,
  isCurrent,
  cta,
  onCta,
  loading,
  variant = "default"
}: {
  readonly name: string;
  readonly description: string;
  readonly features: readonly string[];
  readonly isCurrent: boolean;
  readonly cta: string;
  readonly onCta: () => void;
  readonly loading: boolean;
  readonly variant?: "default" | "highlight";
}) {
  return (
    <div
      className={`relative rounded-[var(--radius-press)] border p-6 transition-all duration-300 ${
        variant === "highlight"
          ? "border-terracota/30 bg-offwhite shadow-[5px_5px_0px_rgba(181,90,59,0.1)]"
          : "border-borda/20 bg-offwhite shadow-[3px_3px_0px_rgba(26,46,60,0.06)]"
      }`}
    >
      {isCurrent && (
        <div className="absolute -top-3 left-6">
          <span className="inline-block rounded-sm bg-azul px-3 py-1 font-inter text-[0.6rem] font-bold uppercase tracking-widest text-white shadow-[2px_2px_0px_rgba(0,0,0,0.15)]">
            Atual
          </span>
        </div>
      )}

      <div className="mb-1">
        <Text as="h3" variant="label" className={`font-playfair text-lg ${variant === "highlight" ? "text-terracota" : "text-azul"}`}>
          {name}
        </Text>
      </div>

      <Text variant="meta" className="mb-4 text-ink-muted">
        {description}
      </Text>

      <ul className="space-y-2 mb-6">
        {features.map((feature, index) => (
          <li key={index} className="flex items-start gap-2">
            <svg viewBox="0 0 20 20" fill="currentColor" className={`h-4 w-4 shrink-0 mt-0.5 ${variant === "highlight" ? "text-terracota" : "text-musgo"}`}>
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
            <span className="font-inter text-sm text-texto-sec">
              {feature}
            </span>
          </li>
        ))}
      </ul>

      {!isCurrent && (
        <Button
          type="button"
          disabled={loading}
          onClick={onCta}
          className={variant === "highlight" ? "w-full bg-terracota text-white shadow-[3px_3px_0px_rgba(0,0,0,0.12)] hover:bg-terracota/90" : "w-full"}
        >
          {loading ? "…" : cta}
        </Button>
      )}
    </div>
  );
}

function ToggleButton(props: { readonly active: boolean; readonly label: string; readonly onClick: () => void }) {
  return (
    <button
      type="button"
      className={
        props.active
          ? "rounded-full border border-terracota/40 bg-terracota/10 px-4 py-1.5 font-inter text-sm font-medium text-terracota"
          : "rounded-full border border-borda/40 px-4 py-1.5 font-inter text-sm text-texto-sec transition-colors hover:text-azul hover:border-borda/60"
      }
      aria-pressed={props.active}
      onClick={props.onClick}
    >
      {props.label}
    </button>
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
    <Container className="py-8 md:py-10">
      <div className="mb-8">
        <Text as="h1" variant="h1" className="mb-2 font-playfair text-azul">
          {messages.plans.title}
        </Text>
        <Text variant="body" className="max-w-2xl text-ink-muted">
          {messages.plans.subtitle}
        </Text>
      </div>

      {statusBanner ? (
        <AppCard className="mb-6 border-terracota/30 bg-terracota/5">
          <Text variant="body" className="text-terracota">{statusBanner}</Text>
        </AppCard>
      ) : null}

      {checkoutError ? (
        <AppCard className="mb-6 border-terracota/20 bg-terracota/5">
          <Text variant="meta" className="text-terracota">
            {messages.plans.checkoutError}
          </Text>
        </AppCard>
      ) : null}

      <section className="mb-10">
        <SectionLabel>{messages.plans.currentPlan}</SectionLabel>
        {loadError ? (
          <AppCard className="border-terracota/20 bg-terracota/5">
            <Text variant="meta" className="text-terracota">
              {messages.plans.loadError}
            </Text>
          </AppCard>
        ) : entitlement ? (
          <AppCard className="border-azul/20 bg-azul/5">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border-2 border-azul/30 bg-creme">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6 text-azul">
                  <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" />
                  <circle cx="12" cy="9" r="2.5" />
                </svg>
              </div>
              <div>
                <Text variant="label" className="font-playfair text-azul">{currentPlanLabel}</Text>
                <Text variant="meta" className="text-ink-muted">{messages.plans.usageHint}</Text>
              </div>
            </div>
          </AppCard>
        ) : (
          <AppCard>
            <Text variant="meta" className="text-ink-muted">…</Text>
          </AppCard>
        )}
      </section>

      <section className="mb-10">
        <SectionLabel>{messages.plans.changePlan}</SectionLabel>

        <AppCard className="mb-6">
          <Text variant="meta" className="mb-4 text-ink-muted">
            {messages.plans.changePlanDescription}
          </Text>

          <div className="mb-4">
            <Text variant="label" className="mb-3 block font-inter text-xs font-semibold uppercase tracking-wider text-texto-sec">
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

          <div className="mb-4">
            <Text variant="label" className="mb-3 block font-inter text-xs font-semibold uppercase tracking-wider text-texto-sec">
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
            <div className="mb-4">
              <Text variant="label" className="mb-3 block font-inter text-xs font-semibold uppercase tracking-wider text-texto-sec">
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
        </AppCard>

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
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
            variant="highlight"
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
      </section>

      <section>
        <SectionLabel>{messages.plans.topUp}</SectionLabel>
        <AppCard className="border-borda/15">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <Text variant="label" className="mb-1 block font-playfair text-azul">
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
        </AppCard>
      </section>
    </Container>
  );
}
