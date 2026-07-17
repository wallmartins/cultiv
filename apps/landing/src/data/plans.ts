import type { PlanId } from "../config";
import { GENERATED_PLAN_NUMBERS } from "./plans.generated";

export const ANNUAL_DISCOUNT = 0.2;

export interface Plan {
  id: PlanId;
  name: string;
  featured?: boolean;
  tag: { pt: string; en: string };
  priceValue: number;
  price: {
    brl: { monthly: string; annual: string };
    usd: { monthly: string; annual: string };
  };
  priceSub: { pt: string; en: string };
  features: { pt: string; en: string }[];
}

// Cópia bilíngue hand-authored. Os NÚMEROS (preço/gerações/id/featured) vêm do catálogo canônico
// do backend via plans.generated.ts (packages/payments/src/catalog-pricing.json) — não editar números
// aqui. O trial não é um plano do catálogo (não tem preço), então não aparece nesta lista.
const BILLED_MONTHLY = { pt: "por mês · cobrança mensal", en: "per month · billed monthly" };

const PLAN_COPY: Record<PlanId, { tag: Plan["tag"]; priceSub: Plan["priceSub"]; features: Plan["features"] }> = {
  explorador: {
    tag: { pt: "Pra experimentar de verdade.", en: "To really try it out." },
    priceSub: BILLED_MONTHLY,
    features: [
      { pt: "Perfil de Voz completo", en: "Full Voice Profile" },
      { pt: "1 perfil de audiência", en: "1 audience profile" },
      { pt: "15 gerações por mês", en: "15 generations per month" },
      { pt: "Formatos essenciais", en: "Essential formats" }
    ]
  },
  criador: {
    tag: { pt: "O melhor equilíbrio custo × benefício.", en: "The best value for money." },
    priceSub: BILLED_MONTHLY,
    features: [
      { pt: "Tudo do Explorador", en: "Everything in Explorador" },
      { pt: "3 perfis de audiência", en: "3 audience profiles" },
      { pt: "30 gerações por mês", en: "30 generations per month" },
      { pt: "Todos os formatos e canais", en: "All formats and channels" },
      { pt: "Refinamento avançado", en: "Advanced refinement" }
    ]
  },
  profissional: {
    tag: { pt: "Pra volume e uso pesado.", en: "For volume and heavy use." },
    priceSub: BILLED_MONTHLY,
    features: [
      { pt: "Tudo do Criador", en: "Everything in Criador" },
      { pt: "Perfis de audiência ilimitados", en: "Unlimited audience profiles" },
      { pt: "80 gerações por mês", en: "80 generations per month" },
      { pt: "Suporte prioritário", en: "Priority support" }
    ]
  }
};

export const PLANS: Plan[] = GENERATED_PLAN_NUMBERS.map((numbers) => {
  const copy = PLAN_COPY[numbers.id];
  return {
    id: numbers.id,
    name: numbers.name,
    ...(numbers.featured ? { featured: true } : {}),
    tag: copy.tag,
    priceValue: numbers.priceValue,
    price: numbers.price,
    priceSub: copy.priceSub,
    features: copy.features
  };
});
