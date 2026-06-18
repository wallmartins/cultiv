import { useEffect, useState } from "react";
import { useSearch } from "@tanstack/react-router";
import { Button, Container, Text } from "@my-ai-orchestrator/ui";
import type { BillingCheckoutPeriod, BillingCurrency, BillingPaymentMethod } from "@my-ai-orchestrator/contracts";
import { useAppLocale } from "~/i18n/app/use-app-locale";
import { useClientSdk } from "~/platform/runtime/client-sdk-context";
import { AppCard } from "~/platform/ui/AppCard";

type CheckoutStatus = "success" | "cancel" | undefined;

export function BillingScreen() {
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
    readonly availableCredits: number;
    readonly monthlyCreditsRemaining: number;
  } | null>(null);
  const [loadError, setLoadError] = useState(false);
  const [checkoutError, setCheckoutError] = useState(false);
  const [loadingCheckout, setLoadingCheckout] = useState<"pro" | "topup" | null>(null);

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
    setLoadingCheckout(productKind === "topup" ? "topup" : "pro");

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
  const statusBanner =
    search.status === "success"
      ? messages.billing.checkoutSuccess
      : search.status === "cancel"
        ? messages.billing.checkoutCancel
        : null;

  return (
    <Container className="py-8 md:py-10">
      <Text as="h1" variant="h1" className="mb-8">
        {messages.billing.title}
      </Text>

      {statusBanner ? (
        <AppCard className="mb-6 border-moss/30 bg-moss/5">
          <Text variant="body">{statusBanner}</Text>
        </AppCard>
      ) : null}

      <section className="mb-8 space-y-4">
        <AppCard>
          <Text variant="label" className="mb-3 block">
            {messages.billing.currentPlan}
          </Text>
          {loadError ? (
            <Text variant="meta" className="text-muted-foreground">
              {messages.billing.loadError}
            </Text>
          ) : entitlement ? (
            <div className="space-y-2">
              <Text variant="body">
                {entitlement.tier === "pro" ? messages.billing.planPro : messages.billing.planFree}
              </Text>
              <Text variant="meta" className="text-muted-foreground">
                {messages.billing.creditsBalance.replace(
                  "{count}",
                  String(entitlement.availableCredits)
                )}
              </Text>
            </div>
          ) : (
            <Text variant="meta" className="text-muted-foreground">
              …
            </Text>
          )}
        </AppCard>
      </section>

      <section className="mb-8 space-y-4">
        <AppCard>
          <Text variant="label" className="mb-4 block">
            {messages.billing.currencyLabel}
          </Text>
          <div className="mb-6 flex flex-wrap gap-2">
            <ToggleButton
              active={currency === "BRL"}
              label={messages.billing.currency.brl}
              onClick={() => setCurrency("BRL")}
            />
            <ToggleButton
              active={currency === "USD"}
              label={messages.billing.currency.usd}
              onClick={() => {
                setCurrency("USD");
                setPaymentMethod("card");
              }}
            />
          </div>

          <Text variant="label" className="mb-4 block">
            {messages.billing.periodLabel}
          </Text>
          <div className="mb-6 flex flex-wrap gap-2">
            <ToggleButton
              active={billingPeriod === "monthly"}
              label={messages.billing.periodMonthly}
              onClick={() => setBillingPeriod("monthly")}
            />
            <ToggleButton
              active={billingPeriod === "annual"}
              label={messages.billing.periodAnnual}
              onClick={() => setBillingPeriod("annual")}
            />
          </div>

          {currency === "BRL" ? (
            <>
              <Text variant="label" className="mb-4 block">
                {messages.billing.paymentMethodLabel}
              </Text>
              <div className="mb-6 flex flex-wrap gap-2">
                <ToggleButton
                  active={paymentMethod === "card"}
                  label={messages.billing.paymentCard}
                  onClick={() => setPaymentMethod("card")}
                />
                <ToggleButton
                  active={paymentMethod === "pix"}
                  label={messages.billing.paymentPix}
                  onClick={() => setPaymentMethod("pix")}
                />
              </div>
              {paymentMethod === "pix" ? (
                <Text variant="meta" className="mb-4 text-muted-foreground">
                  {messages.billing.pixOnlyBrl}
                </Text>
              ) : billingPeriod === "annual" ? (
                <Text variant="meta" className="mb-4 text-muted-foreground">
                  {messages.billing.annualInstallments}
                </Text>
              ) : null}
            </>
          ) : null}

          {!isPro ? (
            <Button
              type="button"
              disabled={loadingCheckout !== null}
              onClick={() => void startCheckout("subscription", "pro", billingPeriod)}
            >
              {loadingCheckout === "pro" ? messages.billing.redirecting : messages.billing.upgradePro}
            </Button>
          ) : (
            <Text variant="meta" className="text-muted-foreground">
              {messages.billing.alreadyPro}
            </Text>
          )}
        </AppCard>
      </section>

      <section className="space-y-4">
        <AppCard>
          <Text variant="label" className="mb-2 block">
            {messages.billing.topUp}
          </Text>
          <Text variant="meta" className="mb-4 text-muted-foreground">
            {messages.billing.topUpDescription}
          </Text>
          <Button
            type="button"
            variant="ghost"
            disabled={loadingCheckout !== null}
            onClick={() => void startCheckout("topup", "topup_500", "one_time")}
          >
            {loadingCheckout === "topup" ? messages.billing.redirecting : messages.billing.topUpCta}
          </Button>
        </AppCard>
      </section>

      {checkoutError ? (
        <Text variant="meta" className="mt-4 text-red-700">
          {messages.billing.checkoutError}
        </Text>
      ) : null}
    </Container>
  );
}

function ToggleButton(props: { readonly active: boolean; readonly label: string; readonly onClick: () => void }) {
  return (
    <button
      type="button"
      className={
        props.active
          ? "rounded-full border border-moss/40 bg-moss/10 px-4 py-1.5 text-sm font-medium text-foreground"
          : "rounded-full border border-border-subtle/70 px-4 py-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
      }
      aria-pressed={props.active}
      onClick={props.onClick}
    >
      {props.label}
    </button>
  );
}
