import { useMessages } from "../i18n/index.js";
import type { BillingCurrencyUI, BillingPeriodUI } from "./types.js";

export interface BillingTogglesProps {
  readonly period: BillingPeriodUI;
  readonly currency: BillingCurrencyUI;
  readonly onPeriodChange: (period: BillingPeriodUI) => void;
  readonly onCurrencyChange: (currency: BillingCurrencyUI) => void;
}

function toggleClass(active: boolean): string {
  return ["billing-toggle-option", active && "is-active"].filter(Boolean).join(" ");
}

export function BillingToggles({ period, currency, onPeriodChange, onCurrencyChange }: BillingTogglesProps) {
  const t = useMessages();
  return (
    <div className="billing-toggles">
      <div className="billing-toggle-group">
        <button type="button" className={toggleClass(period === "monthly")} onClick={() => onPeriodChange("monthly")}>
          {t.plans.period.monthly}
        </button>
        <button type="button" className={toggleClass(period === "annual")} onClick={() => onPeriodChange("annual")}>
          {t.plans.period.annual}
        </button>
      </div>
      <div className="billing-toggle-group">
        <button type="button" className={toggleClass(currency === "BRL")} onClick={() => onCurrencyChange("BRL")}>
          BRL
        </button>
        <button type="button" className={toggleClass(currency === "USD")} onClick={() => onCurrencyChange("USD")}>
          USD
        </button>
      </div>
    </div>
  );
}
