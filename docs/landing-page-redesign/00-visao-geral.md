# Visão Geral — Redesign da Landing Page

## Objetivo

Transformar a landing page do Cultiv de uma página descritiva em uma página que VENDE: demonstrar o produto antes de explicar, criar desejo com métricas reais, e converter com um funil claro (demo grátis → wizard grátis → geração paga).

## Diagnóstico Atual

| Dimensão | Nota | Problema principal |
|---|---|---|
| Claridade | 5/10 | Metáforas cartográficas confundem visitante |
| Memorabilidade | 4/10 | Headline abstrata, sem números |
| Desejo | 5/10 | Vende features, não desejo humano |
| Demo | 3/10 | Comparação estática, sem interatividade |
| Pricing | 3/10 | Preços escondidos, free tier queima receita |
| Prova | 2/10 | 1 depoimento sem nome, zero presença do founder |
| Compartilhabilidade | 3/10 | OG image genérica, footer sem gancho |
| Diferenciação | 6/10 | Produto é único, mas a landing não mostra |
| CTA | 5/10 | Dois CTAs competindo |
| Voz do founder | 3/10 | Copy genérica, sem história |

**Score atual: 39/100 → Score alvo: 78/100**

## Modelo de Negócio Definido

```
FREE (ganho)                    PAID (monetização)
┌──────────────────┐           ┌──────────────────────────┐
│ Demo interativo  │           │ Explorador: R$49/mês     │
│ (landing page)   │           │ 10 gerações/mês          │
│                  │           │                          │
│ Wizard de voz    │──────────▶│ Criador: R$99/mês        │
│ (5 etapas)       │           │ 40 gerações/mês          │
│ Perfil pronto    │           │                          │
│                  │           │ Profissional: R$199/mês  │
│ 0 investimento   │           │ 120 gerações/mês         │
└──────────────────┘           └──────────────────────────┘
```

**Regra:** Free = demo + wizard. Paid = geração. Sem free tier com gerações.

## Arquivos Afetados

### Arquivos de copy (textos)
| Arquivo | Mudanças |
|---|---|
| `apps/web/src/i18n/marketing/locales/pt.ts` | Hero, nav, problem, comparison, pricing, FAQ, footer, testimonials |
| `apps/web/src/i18n/marketing/locales/en.ts` | Idem |

### Arquivos de componente
| Arquivo | Mudanças |
|---|---|
| `apps/web/src/marketing/sections/HeroSection.tsx` | Reestruturar hero com demo interativo |
| `apps/web/src/marketing/sections/ProblemSection.tsx` | Novo copy dos cards |
| `apps/web/src/marketing/sections/ComparisonSection.tsx` | Adicionar coluna "Trabalho manual" |
| `apps/web/src/marketing/sections/HowItWorksSection.tsx` | Simplificar ou mesclar com demo |
| `apps/web/src/marketing/sections/PricingSection.tsx` | 3 planos pagos, sem free |
| `apps/web/src/marketing/sections/TestimonialSection.tsx` | 3 depoimentos nomeados |
| `apps/web/src/marketing/sections/FaqSection.tsx` | Novas perguntas |
| `apps/web/src/marketing/sections/FooterSection.tsx` | Frase memorável + share prompt |
| `apps/web/src/marketing/components/BelowFoldSections.tsx` | Reordenar seções |

### Arquivos de config/novo
| Arquivo | Mudanças |
|---|---|
| `apps/web/src/marketing/content/plans/marketing-plan-catalog.ts` | Novos preços, sem free |
| `apps/web/src/marketing/navigation/marketing-nav-items.ts` | Renomear itens |
| `apps/web/src/marketing/visual/HeroComparisonFrame.tsx` | Substituir por demo interativo |
| **NOVO:** `apps/web/src/marketing/sections/InteractiveDemoSection.tsx` | Demo de colar texto → ver métricas |
| **NOVO:** `apps/web/src/marketing/components/MetricsDisplay.tsx` | Componente de exibição de métricas |
| `apps/web/src/marketing/seo/og-image.ts` | Nova OG image concept |
| `apps/web/src/brand/assets.ts` | Possível novo OG image path |

### Arquivos de SEO
| Arquivo | Mudanças |
|---|---|
| `apps/web/src/marketing/seo/resolve-page-head.ts` | Novo title/description |
| `apps/web/src/marketing/seo/resolve-page-seo.ts` | Novas meta tags |
| `apps/web/src/i18n/marketing/locales/pt.ts` (seo) | Novo homeTitle, homeDescription |
| `apps/web/src/i18n/marketing/locales/en.ts` (seo) | Idem |

## Ordem de Implementação

### Fase 1: Copy Base (sem quebrar layout)
1. Atualizar `pt.ts` — hero, nav, problem, comparison, pricing, FAQ, footer, testimonials, seo
2. Atualizar `en.ts` — idem
3. Atualizar `marketing-nav-items.ts` — renomear itens
4. Atualizar `marketing-plan-catalog.ts` — novos preços

### Fase 2: Layout e Componentes
5. Atualizar `HeroSection.tsx` — novo layout com demo
6. Atualizar `ProblemSection.tsx` — novo copy dos cards
7. Atualizar `ComparisonSection.tsx` — 3 colunas
8. Atualizar ou remover `HowItWorksSection.tsx`
9. Atualizar `PricingSection.tsx` — sem free tier
10. Atualizar `TestimonialSection.tsx` — 3 depoimentos
11. Atualizar `FaqSection.tsx` — novas perguntas
12. Atualizar `FooterSection.tsx` — frase + share
13. Atualizar `BelowFoldSections.tsx` — reordenar

### Fase 3: Demo Interativo
14. Criar `InteractiveDemoSection.tsx`
15. Criar `MetricsDisplay.tsx`
16. Integrar no hero ou como seção dedicada

### Fase 4: SEO e OG
17. Atualizar SEO metadata
18. Criar OG image concept
19. Atualizar `og-image.ts`

### Fase 5: Testemunhos
20. Coletar 3 depoimentos reais
21. Adicionar ao `pt.ts` e `en.ts`

### Fase 6: Validação
22. Testar em mobile e desktop
23. Verificar acessibilidade
24. Testar fluxo completo: demo → wizard → pagamento

## Dependências

```
Copy (Fase 1)
    │
    ├──▶ Layout (Fase 2) — componentes usam os textos
    │
    ├──▶ Demo Interativo (Fase 3) — precisa do copy do hero
    │
    └──▶ SEO (Fase 4) — precisa do copy final

Testemunhos (Fase 5) — independente, pode rodar em paralelo

Validação (Fase 6) — depois de tudo
```

## Riscos

| Risco | Impacto | Mitigação |
|---|---|---|
| Demo interativo lento no mobile | UX ruim | Lazy loading, simplificar animações |
| Copy novo não converte | Receita cai | A/B test hero antigo vs novo |
| Preço R$49 é alto para entry | Poucos signups | Testar R$39 se needed |
| 3 depoimentos não disponíveis | Seção vazia | Usar placeholder "Em breve" |
| OG image precisa de design | Atraso | Usar template de código primeiro |
