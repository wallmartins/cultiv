import { Mono } from "../primitives/index.js";
import { useMessages } from "../i18n/index.js";
import { BalanceCard, type BalanceCardProps } from "./BalanceCard.js";
import { LedgerStatement, type LedgerRowData } from "./LedgerStatement.js";
import { PlanCard, type PlanCardProps } from "./PlanCard.js";
import { SubscriptionBanner, type SubscriptionBannerProps } from "./SubscriptionBanner.js";

export interface BillingScreenProps {
  readonly loading: boolean;
  readonly banner?: SubscriptionBannerProps;
  readonly balance?: BalanceCardProps;
  readonly plan?: PlanCardProps;
  readonly ledgerRows: readonly LedgerRowData[];
  readonly ledgerLoading?: boolean;
}

// Column composition (max-width 680px): eyebrow → banner (conditional) → balance+plan grid → extrato.
// Loading/empty are in-flow regions of this same tree, never a separate screen.
export function BillingScreen({ loading, banner, balance, plan, ledgerRows, ledgerLoading }: BillingScreenProps) {
  const t = useMessages();
  const ready = !loading && balance && plan;

  return (
    <div style={{ maxWidth: 680, margin: "0 auto", display: "flex", flexDirection: "column", gap: "var(--sp-lg)" }}>
      <Mono eyebrow>{t.billing.eyebrow}</Mono>

      {ready ? (
        <>
          {banner ? <SubscriptionBanner {...banner} /> : null}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
              gap: "var(--sp-lg)"
            }}
          >
            <BalanceCard {...balance} />
            <PlanCard {...plan} />
          </div>
        </>
      ) : (
        <Mono style={{ color: "var(--dim)" }}>{t.common.loading}</Mono>
      )}

      <LedgerStatement rows={ledgerRows} loading={ledgerLoading} />
    </div>
  );
}
