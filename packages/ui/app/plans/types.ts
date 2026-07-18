export type PaywallTrigger = "trial_expired" | "usage_restricted" | "low_balance" | "calibration_limit";

export type BillingPeriodUI = "monthly" | "annual";
export type BillingCurrencyUI = "BRL" | "USD";

export interface PlanCardData {
  readonly id: string;
  readonly name: string;
  readonly tag?: string;
  readonly featured: boolean;
  readonly current: boolean;
  readonly priceLabel: string;
  readonly billNote: string;
  readonly generations: number;
  readonly features: readonly string[];
  readonly ctaLabel: string;
  readonly ctaDisabled: boolean;
  readonly onSelect: () => void;
}

// Discriminated union (mirrors shell/types.ts's VoiceCompanionContent) — each phase carries its
// own copy inputs + the callbacks its CTAs need, so CheckoutOverlay stays a pure switch.
// "topup" only diverges from "subscription" in the success copy (a one-time credit purchase
// isn't a subscription) — everything else in the flow (redirect, pending, failed) reads the same.
export type CheckoutProductKind = "subscription" | "topup";

export type CheckoutPhase =
  | { readonly kind: "redirecting"; readonly label: string; readonly meta?: string }
  | {
      readonly kind: "success";
      readonly product: CheckoutProductKind;
      readonly itemLabel: string;
      readonly onDone: () => void;
    }
  | { readonly kind: "pending"; readonly product: CheckoutProductKind; readonly onDone: () => void }
  | { readonly kind: "failed"; readonly onRetry?: () => void; readonly onDismiss: () => void };
