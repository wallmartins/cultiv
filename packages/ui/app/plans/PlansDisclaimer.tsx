export interface PlansDisclaimerProps {
  readonly text: string;
}

// Text is backend-owned (PlanCatalogView.generationsDisclaimer) — never hardcoded here.
export function PlansDisclaimer({ text }: PlansDisclaimerProps) {
  return <span className="plans-disclaimer">{text}</span>;
}
