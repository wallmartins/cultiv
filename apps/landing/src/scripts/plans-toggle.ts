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

export function initPlansToggle(): void {
  const section = document.getElementById("planos");
  if (!section) return;
  const root: HTMLElement = section;

  const currencyBtns = Array.from(root.querySelectorAll<HTMLButtonElement>("[data-currency]"));
  const cycleBtns = Array.from(root.querySelectorAll<HTMLButtonElement>("[data-cycle]"));
  if (!currencyBtns.length || !cycleBtns.length) return;

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
