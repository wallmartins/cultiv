import type { BillingFeatureAllowance } from "./types.js";

// key→copy humana localizada — só os features com enabled:true viram bullet.
const FEATURE_COPY: Readonly<Record<string, string>> = {
  "execution.sync_mode": "geração em tempo real",
  "content.language.refinement": "refinamento de linguagem incluído",
  "rollout.beta.access": "acesso antecipado a novidades"
};

export const FEATURED_PLAN_TAG = "mais escolhido";

// literal, hard rule (ADR 0006 §3 / breakdown-12 §1a) — o front não inventa esse texto.
export const GENERATIONS_DISCLAIMER =
  '"gerações/mês" é uma aproximação em mix balanceado — o custo real varia por tamanho e qualidade';

export function mapPlanFeaturesToBullets(features: readonly BillingFeatureAllowance[]): string[] {
  return features
    .filter((feature) => feature.enabled)
    .map((feature) => FEATURE_COPY[feature.key])
    .filter((copy): copy is string => copy !== undefined);
}
