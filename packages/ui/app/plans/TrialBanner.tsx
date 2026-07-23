import { Mono, StatusDot } from "../primitives/index.js";
import { useMessages } from "../i18n/index.js";

export interface TrialBannerProps {
  readonly used: number;
  readonly remaining: number;
  readonly totalGenerations: number;
  readonly daysRemaining: number;
}

export function TrialBanner({ used, remaining, totalGenerations, daysRemaining }: TrialBannerProps) {
  const t = useMessages();
  return (
    <div className="trial-banner">
      <StatusDot tone="accent" size={6} />
      <Mono>{t.plans.trialBanner(used, totalGenerations, remaining, t.common.days(daysRemaining))}</Mono>
    </div>
  );
}
