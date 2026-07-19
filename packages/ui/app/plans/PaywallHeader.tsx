import { Panel, Ring, Serif } from "../primitives/index.js";
import type { PaywallTrigger } from "./types.js";

export interface PaywallHeaderProps {
  readonly trigger: PaywallTrigger;
  // low_balance only — creditsAsTexts(availableCredits, canonicalCreditCost) from the container.
  readonly creditsAsTexts?: number;
}

// Copy is static in the presentational layer (ticket 12 §1c) — the container only passes the
// trigger + the derived text count, never raw copy.
const COPY: Record<PaywallTrigger, { title: string; sub: (creditsAsTexts?: number) => string }> = {
  trial_expired: {
    title: "Seu teste terminou.",
    sub: () =>
      "Foram as 5 gerações do período de teste. Sua voz continua pronta — escolha um plano pra seguir escrevendo."
  },
  usage_restricted: {
    title: "Você atingiu o limite do seu plano.",
    sub: () => "As gerações renovam no próximo ciclo — ou suba de plano e continue agora."
  },
  low_balance: {
    title: "Seus créditos estão acabando.",
    sub: (creditsAsTexts) => `Restam ~${creditsAsTexts ?? 0} textos. Garanta a continuidade antes de faltar.`
  },
  calibration_limit: {
    title: "Você atingiu o limite de recalibrações.",
    sub: () => "Planos maiores incluem mais recalibrações por mês — sua voz agradece."
  }
};

export function PaywallHeader({ trigger, creditsAsTexts }: PaywallHeaderProps) {
  const copy = COPY[trigger];

  return (
    <Panel className="paywall-header">
      <Ring value={0.22} size={40} width={2.5} tone="accent" />
      <div>
        <Serif as="div" size="1.4rem" lineHeight={1.25}>
          {copy.title}
        </Serif>
        <div className="paywall-header-sub">{copy.sub(creditsAsTexts)}</div>
      </div>
    </Panel>
  );
}
