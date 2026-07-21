import "./plans.css";
import { Mono, Pill, Serif } from "../primitives/index.js";
import { useMessages } from "../i18n/index.js";
import { BillingToggles } from "./BillingToggles.js";
import { PaywallHeader } from "./PaywallHeader.js";
import { PlanCard } from "./PlanCard.js";
import { PlansDisclaimer } from "./PlansDisclaimer.js";
import { TopUpLink } from "./TopUpLink.js";
import { TrialBanner } from "./TrialBanner.js";
import type { BillingCurrencyUI, BillingPeriodUI, PaywallTrigger, PlanCardData } from "./types.js";

export interface PlansScreenProps {
  readonly paywall?: { readonly trigger: PaywallTrigger; readonly creditsAsTexts?: number };
  readonly trialBanner?: {
    readonly used: number;
    readonly remaining: number;
    readonly totalGenerations: number;
    readonly daysRemaining: number;
  };
  readonly period: BillingPeriodUI;
  readonly currency: BillingCurrencyUI;
  readonly onPeriodChange: (period: BillingPeriodUI) => void;
  readonly onCurrencyChange: (currency: BillingCurrencyUI) => void;
  readonly plansState: "loading" | "error" | "ready";
  readonly plans: readonly PlanCardData[];
  readonly onRetryPlans?: () => void;
  readonly disclaimer: string;
  readonly topUp?: { readonly onClick: () => void; readonly disabled?: boolean };
}

export function PlansScreen({
  paywall,
  trialBanner,
  period,
  currency,
  onPeriodChange,
  onCurrencyChange,
  plansState,
  plans,
  onRetryPlans,
  disclaimer,
  topUp
}: PlansScreenProps) {
  const t = useMessages();
  return (
    <div className="plans-screen">
      <div className="plans-screen-inner">
        {paywall ? <PaywallHeader trigger={paywall.trigger} creditsAsTexts={paywall.creditsAsTexts} /> : null}
        {!paywall && trialBanner ? (
          <TrialBanner
            used={trialBanner.used}
            remaining={trialBanner.remaining}
            totalGenerations={trialBanner.totalGenerations}
            daysRemaining={trialBanner.daysRemaining}
          />
        ) : null}
        <div className="plans-heading">
          <Serif as="h1" className="plans-heading-title">
            {t.plans.heading.prefix}
            <em>{t.plans.heading.emphasis}</em>
            {t.plans.heading.suffix}
          </Serif>
          <BillingToggles
            period={period}
            currency={currency}
            onPeriodChange={onPeriodChange}
            onCurrencyChange={onCurrencyChange}
          />
        </div>
        <PlanGrid state={plansState} plans={plans} onRetry={onRetryPlans} />
        <div className="plans-footer">
          <PlansDisclaimer text={disclaimer} />
          {topUp ? <TopUpLink onClick={topUp.onClick} disabled={topUp.disabled} /> : null}
        </div>
      </div>
    </div>
  );
}

function PlanGrid({
  state,
  plans,
  onRetry
}: {
  readonly state: "loading" | "error" | "ready";
  readonly plans: readonly PlanCardData[];
  readonly onRetry?: () => void;
}) {
  const t = useMessages();
  if (state === "loading") {
    return (
      <div className="plan-grid is-loading">
        {[0, 1, 2].map((slot) => (
          <div className="plan-card plan-card-skeleton" key={slot} />
        ))}
      </div>
    );
  }

  if (state === "error") {
    return (
      <div className="plans-catalog-error">
        <Mono>{t.plans.catalogError}</Mono>
        {onRetry ? (
          <Pill variant="outline" onClick={onRetry}>
            {t.common.retry}
          </Pill>
        ) : null}
      </div>
    );
  }

  return (
    <div className="plan-grid">
      {plans.map((plan) => (
        <PlanCard plan={plan} key={plan.id} />
      ))}
    </div>
  );
}
