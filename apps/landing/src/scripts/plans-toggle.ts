// Plans segmented toggle — ported from the design's renderVals pricing
// island (setBRL/setUSD/setMonthly/setAnnual + brlBg/brlColor/monBg/monColor/
// annBg/annColor + exPrice/crPrice/prPrice/priceSub, ~3211–3234). The design
// computes background/color per state and writes them as inline styles;
// here the same states are expressed as `aria-pressed` (plans.css keys off
// the attribute selector), so this module only flips booleans, swaps text,
// and rewrites CTA hrefs — no inline style writes.
//
// Card data (prices, ids) comes from src/data/plans.ts — this module does
// NOT duplicate the catalog. The annual-cycle priceSub copy is UI chrome for
// this toggle (not plan data — see plans.ts's own note), so it lives here.
import { PLANS, type Plan } from "../data/plans";
import { planUrl, type PlanPeriod } from "../config";

type Currency = "BRL" | "USD";

const CYCLE_SUB: Record<PlanPeriod, { pt: string; en: string }> = {
  monthly: { pt: "por mês · cobrança mensal", en: "per month · billed monthly" },
  annual: { pt: "por mês · cobrado anualmente", en: "per month · billed annually" },
};

function priceFor(plan: Plan, currency: Currency, cycle: PlanPeriod): string {
  const table = currency === "USD" ? plan.price.usd : plan.price.brl;
  return table[cycle];
}

/** Wires the currency + billing-cycle segmented controls inside #planos.
    No-ops if the markup isn't there (defensive — matches every other
    section script's tolerate-absence convention). */
export function initPlansToggle(): void {
  const section = document.getElementById("planos");
  if (!section) return;
  // Re-bind with an explicit non-null type — TS's control-flow narrowing on
  // `section` doesn't survive into the nested closures below.
  const root: HTMLElement = section;

  const currencyBtns = Array.from(root.querySelectorAll<HTMLButtonElement>("[data-currency]"));
  const cycleBtns = Array.from(root.querySelectorAll<HTMLButtonElement>("[data-cycle]"));
  if (!currencyBtns.length || !cycleBtns.length) return;

  // Mirrors the static HTML defaults (BRL, monthly) — JS-off already shows
  // this state, so no initial render() call is needed.
  let currency: Currency = "BRL";
  let cycle: PlanPeriod = "monthly";

  function render(): void {
    for (const plan of PLANS) {
      const priceEl = root.querySelector<HTMLElement>(`[data-plan-price="${plan.id}"]`);
      if (priceEl) priceEl.textContent = priceFor(plan, currency, cycle);

      const subPt = root.querySelector<HTMLElement>(`[data-plan-sub="${plan.id}"][data-l="pt"]`);
      const subEn = root.querySelector<HTMLElement>(`[data-plan-sub="${plan.id}"][data-l="en"]`);
      if (subPt) subPt.textContent = CYCLE_SUB[cycle].pt;
      if (subEn) subEn.textContent = CYCLE_SUB[cycle].en;

      const ctaEl = root.querySelector<HTMLAnchorElement>(`[data-plan-cta="${plan.id}"]`);
      if (ctaEl) ctaEl.href = planUrl(plan.id, cycle);
    }
  }

  function setCurrency(next: Currency): void {
    if (currency === next) return;
    currency = next;
    for (const btn of currencyBtns) {
      btn.setAttribute("aria-pressed", String(btn.dataset.currency === next));
    }
    render();
  }

  function setCycle(next: PlanPeriod): void {
    if (cycle === next) return;
    cycle = next;
    for (const btn of cycleBtns) {
      btn.setAttribute("aria-pressed", String(btn.dataset.cycle === next));
    }
    render();
  }

  for (const btn of currencyBtns) {
    btn.addEventListener("click", () => setCurrency(btn.dataset.currency as Currency));
  }
  for (const btn of cycleBtns) {
    btn.addEventListener("click", () => setCycle(btn.dataset.cycle as PlanPeriod));
  }
}
