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
  return (
    <div className="billing-toggles">
      <div className="billing-toggle-group">
        <button type="button" className={toggleClass(period === "monthly")} onClick={() => onPeriodChange("monthly")}>
          mensal
        </button>
        <button type="button" className={toggleClass(period === "annual")} onClick={() => onPeriodChange("annual")}>
          anual −20%
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
