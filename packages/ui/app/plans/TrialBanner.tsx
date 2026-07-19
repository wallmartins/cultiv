import { Mono, StatusDot } from "../primitives/index.js";

export interface TrialBannerProps {
  readonly used: number;
  readonly remaining: number;
  readonly totalGenerations: number;
  readonly daysRemaining: number;
}

export function TrialBanner({ used, remaining, totalGenerations, daysRemaining }: TrialBannerProps) {
  return (
    <div className="trial-banner">
      <StatusDot tone="accent" size={6} />
      <Mono>
        {used} de {totalGenerations} gerações usadas · {remaining} restantes · {daysRemaining} dias de teste
      </Mono>
    </div>
  );
}
