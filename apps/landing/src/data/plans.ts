import type { PlanId } from "../config";

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

export const PLANS: Plan[] = [
  {
    id: "explorador",
    name: "Explorador",
    tag: { pt: "Pra experimentar de verdade.", en: "To really try it out." },
    priceValue: 49,
    price: {
      brl: { monthly: "R$ 49", annual: "R$ 39,20" },
      usd: { monthly: "$9", annual: "$7.20" },
    },
    priceSub: { pt: "por mês · cobrança mensal", en: "per month · billed monthly" },
    features: [
      { pt: "Perfil de Voz completo", en: "Full Voice Profile" },
      { pt: "1 perfil de audiência", en: "1 audience profile" },
      { pt: "15 gerações por mês", en: "15 generations per month" },
      { pt: "Formatos essenciais", en: "Essential formats" },
    ],
  },
  {
    id: "criador",
    name: "Criador",
    featured: true,
    tag: { pt: "O melhor equilíbrio custo × benefício.", en: "The best value for money." },
    priceValue: 99,
    price: {
      brl: { monthly: "R$ 99", annual: "R$ 79,20" },
      usd: { monthly: "$19", annual: "$15.20" },
    },
    priceSub: { pt: "por mês · cobrança mensal", en: "per month · billed monthly" },
    features: [
      { pt: "Tudo do Explorador", en: "Everything in Explorador" },
      { pt: "3 perfis de audiência", en: "3 audience profiles" },
      { pt: "30 gerações por mês", en: "30 generations per month" },
      { pt: "Todos os formatos e canais", en: "All formats and channels" },
      { pt: "Refinamento avançado", en: "Advanced refinement" },
    ],
  },
  {
    id: "profissional",
    name: "Profissional",
    tag: { pt: "Pra volume e uso pesado.", en: "For volume and heavy use." },
    priceValue: 249,
    price: {
      brl: { monthly: "R$ 249", annual: "R$ 199,20" },
      usd: { monthly: "$49", annual: "$39.20" },
    },
    priceSub: { pt: "por mês · cobrança mensal", en: "per month · billed monthly" },
    features: [
      { pt: "Tudo do Criador", en: "Everything in Criador" },
      { pt: "Perfis de audiência ilimitados", en: "Unlimited audience profiles" },
      { pt: "80 gerações por mês", en: "80 generations per month" },
      { pt: "Suporte prioritário", en: "Priority support" },
    ],
  },
];
