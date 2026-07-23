import { Panel, Ring, Serif } from "../primitives/index.js";
import { useMessages } from "../i18n/index.js";
import type { PaywallTrigger } from "./types.js";

export interface PaywallHeaderProps {
  readonly trigger: PaywallTrigger;
  // low_balance only — creditsAsTexts(availableCredits, canonicalCreditCost) from the container.
  readonly creditsAsTexts?: number;
}

export function PaywallHeader({ trigger, creditsAsTexts }: PaywallHeaderProps) {
  const t = useMessages();
  // Copy is static in the presentational layer (ticket 12 §1c) — the container only passes the
  // trigger + the derived text count, never raw copy.
  const copy = {
    trial_expired: t.plans.paywall.trialExpired,
    usage_restricted: t.plans.paywall.usageRestricted,
    low_balance: {
      title: t.plans.paywall.lowBalance.title,
      sub: t.plans.paywall.lowBalance.sub(t.common.texts(creditsAsTexts ?? 0))
    },
    calibration_limit: t.plans.paywall.calibrationLimit
  }[trigger];

  return (
    <Panel className="paywall-header">
      <Ring value={0.22} size={40} width={2.5} tone="accent" />
      <div>
        <Serif as="div" size="1.4rem" lineHeight={1.25}>
          {copy.title}
        </Serif>
        <div className="paywall-header-sub">{copy.sub}</div>
      </div>
    </Panel>
  );
}
