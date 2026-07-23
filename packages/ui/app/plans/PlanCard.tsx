import { Mono, Pill } from "../primitives/index.js";
import { useMessages } from "../i18n/index.js";
import type { PlanCardData } from "./types.js";

export interface PlanCardProps {
  readonly plan: PlanCardData;
}

export function PlanCard({ plan }: PlanCardProps) {
  const t = useMessages();
  const classes = ["plan-card", plan.featured && "is-featured"].filter(Boolean).join(" ");

  return (
    <div className={classes}>
      {plan.tag ? <Mono className="plan-card-tag">{plan.tag}</Mono> : null}
      <div className="plan-card-name">{plan.name}</div>
      <div>
        <span className="num plan-card-price">{plan.priceLabel}</span>
        <Mono className="plan-card-price-note">
          {" "}
          {t.plans.perMonth}
          {plan.billNote}
        </Mono>
      </div>
      <div className="plan-card-features">
        <div className="plan-card-feature">
          <span className="plan-card-dot" />
          <span>
            <span className="num">{plan.generations}</span> {t.plans.generationsPerMonth}
          </span>
        </div>
        {plan.features.map((feature) => (
          <div className="plan-card-feature" key={feature}>
            <span className="plan-card-dot" />
            <span>{feature}</span>
          </div>
        ))}
      </div>
      <Pill
        variant={plan.featured ? "primary" : "secondary"}
        className="plan-card-cta"
        disabled={plan.ctaDisabled}
        onClick={plan.onSelect}
      >
        {plan.ctaLabel}
      </Pill>
    </div>
  );
}
