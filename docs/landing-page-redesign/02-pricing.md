# Pricing — Modelo e Planos

## Modelo de Negócio

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

## Planos Detalhados

### Explorador — R$49/mês

**Público:** Quem quer testar o produto com calma
**Badge:** "Para começar"
**Descrição:** "Ideal para conhecer o Cultiv e gerar seus primeiros textos."

**Features:**
```
- Wizard de voz completo (5 etapas)
- Perfil de voz com 14 métricas
- 10 gerações por mês
- Modo rápido de geração
- Gerações avulsas: R$5,00 cada
- Prévia antes de gerar
```

**Footer do card:** "Cancele quando quiser"

**CTA:** "Assinar"

**Justificativa do preço:**
- R$49 é baixo o suficiente para teste (menos que um almoço)
- R$5,00/geração é caro o suficiente para empurrar para o Criador
- O objetivo é converção, não receita máxima neste plano

### Criador — R$99/mês (MAIS POPULAR)

**Público:** Quem publica regularmente (founders, criadores, marcas)
**Badge:** "Mais popular"
**Descrição:** "Para quem publica com regularidade e quer mais profundidade."

**Features:**
```
- Tudo do Explorador
- 40 gerações por mês
- Modos rápido + equilibrado
- Perfil de voz aprimorado
- Gerações avulsas: R$3,50 cada
- Suporte a textos de médio e longo alcance
```

**Footer do card:** "Cancele quando quiser"

**CTA:** "Assinar"

**Justificativa do preço:**
- R$99 é o sweet spot para SaaS B2C no Brasil
- 40 gerações = ~10 por semana = 2-3 por dia útil
- R$2,48/geração é o melhor custo-benefício visível
- Anchor pricing: este é o plano que a maioria deve escolher

**Destaque visual:** Card levemente elevado (shadow maior), badge "Mais popular" em terracota.

### Profissional — R$199/mês

**Público:** Profissionais de conteúdo, agências, equipes
**Badge:** "Para profissionais"
**Descrição:** "Para quem escreve todo dia e quer o máximo de controle e qualidade."

**Features:**
```
- Tudo do Criador
- 120 gerações por mês
- Todos os modos de geração (incluindo refinado)
- Perfil de voz premium
- Acesso antecipado a novidades
- Prioridade no suporte
- Gerações avulsas: R$2,50 cada
```

**Footer do card:** "Cancele quando quiser"

**CTA:** "Assinar"

**Justificativa do preço:**
- R$199 é premium mas justificado para heavy users
- 120 gerações = ~4 por dia = uso intenso
- R$1,66/geração é o menor custo
- Overage mais barato incentiva fidelidade

## Tabela Comparativa de Planos

```
|                        | Explorador  | Criador     | Profissional |
|---|---|---|---|
| Preço                  | R$49/mês    | R$99/mês    | R$199/mês    |
| Gerações/mês           | 10          | 40          | 120          |
| Custo por geração      | R$4,90      | R$2,48      | R$1,66       |
| Geração avulsa         | R$5,00      | R$3,50      | R$2,50       |
| Wizard de voz          | ✅          | ✅          | ✅           |
| Modo rápido            | ✅          | ✅          | ✅           |
| Modo equilibrado       | ❌          | ✅          | ✅           |
| Modo refinado          | ❌          | ❌          | ✅           |
| Perfil aprimorado      | ❌          | ✅          | ✅           |
| Acesso antecipado      | ❌          | ❌          | ✅           |
| Prioridade suporte     | ❌          | ❌          | ✅           |
```

## Copy da Seção de Pricing

### PT-BR

**Eyebrow:** Planos
**Title:** Crie seu perfil grátis. Pague quando quiser gerar.

**CTA do Explorador:** "Assinar"
**CTA do Criador:** "Assinar"
**CTA do Profissional:** "Assinar"

### EN

**Eyebrow:** Plans
**Title:** Build your profile for free. Pay when you're ready to generate.

## Toggle de Moeda

Manter toggle BRL/USD. Preços USD:

```
| Plano          | BRL     | USD    |
|---|---|---|
| Explorador     | R$49    | $9     |
| Criador        | R$99    | $19    |
| Profissional   | R$199   | $39    |
```

**Nota:** Preços USD devem ser calibrados com pesquisa de mercado. Valores acima são estimativas iniciais.

## Toggle de Período

Manter toggle Mensal/Anual. Desconto anual:

```
| Plano          | Mensal  | Anual    | Economia |
|---|---|---|---|
| Explorador     | R$49    | R$470    | -20%     |
| Criador        | R$99    | R$950    | -20%     |
| Profissional   | R$199   | R$1.910  | -20%     |
```

## Fluxo de Upgrade

```
Explorador (R$49) → consome 10 gerações
    │
    ├── Compra 5 avulsas (R$25) → testa mais
    │
    ├── Precisa de mais → Upgrade para Criador (R$99)
    │   └── 40 gerações/mês, R$3,50 avulsa
    │
    └── Precisa de muito mais → Upgrade para Profissional (R$199)
        └── 120 gerações/mês, R$2,50 avulsa
```

**Sinal de upgrade no app:**
- Quando o usuário consome 80% da quota → notificação: "Você usou 8 de 10 gerações. Precisa de mais? [Ver planos]"
- Quando o usuário compra avulsas 2x no mês → sugestão: "Você já gastou R$10 em avulsas. O Criador custa R$99 e dá 40 gerações."

## Arquivos Afetados

| Arquivo | Mudança |
|---|---|
| `apps/web/src/marketing/content/plans/marketing-plan-catalog.ts` | Atualizar preços, remover free, ajustar quotas |
| `apps/web/src/marketing/sections/PricingSection.tsx` | Remover free tier, atualizar layout |
| `apps/web/src/i18n/marketing/locales/pt.ts` | Novos textos dos planos |
| `apps/web/src/i18n/marketing/locales/en.ts` | Idem |
| `packages/payments/src/` | Possível ajuste nos planos do backend |

## Lógica de Preço no Backend

```typescript
// marketing-plan-catalog.ts

export const MARKETING_SUBSCRIPTION_PRICES = {
  explorador: {
    BRL: { monthly: 49, annual: 470 },
    USD: { monthly: 9, annual: 86 },
  },
  criador: {
    BRL: { monthly: 99, annual: 950 },
    USD: { monthly: 19, annual: 182 },
  },
  profissional: {
    BRL: { monthly: 199, annual: 1910 },
    USD: { monthly: 39, annual: 374 },
  },
} as const;

// Quotas por plano (gerações/mês)
export const PLAN_QUOTAS = {
  explorador: 10,
  criador: 40,
  profissional: 120,
} as const;

// Preço de overage (geração avulsa)
export const OVERAGE_PRICES = {
  explorador: { BRL: 5.00, USD: 1.00 },
  criador: { BRL: 3.50, USD: 0.70 },
  profissional: { BRL: 2.50, USD: 0.50 },
} as const;
```

## Validação

- [ ] Preços BRL calibrados com mercado
- [ ] Preços USD validados
- [ ] Desconto anual calculado corretamente
- [ ] Toggle BRL/USD funciona
- [ ] Toggle Mensal/Anual funciona
- [ ] Card "Mais popular" destacado visualmente
- [ ] CTA de cada plano leva ao checkout correto
- [ ] Fluxo de upgrade funciona no backend
- [ ] Notificação de quota baixa funciona
