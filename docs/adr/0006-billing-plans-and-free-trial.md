# Billing, Planos e Free Trial

**Status:** accepted
**Complementa:** ADR 0003 (detalha billing/planos do workspace) · coerente com ADR 0005 (shell/rotas) e ADR 0004 (geração)
**Emenda:** ADR 0005 §3 — o gate de entrada ganha uma dimensão de trial (ver Decisão 7)
**Trilha de decisão:** `.scratch/rotas-secundarias-app/` (mapa wayfinder + tickets 03/09/10/13/14 e assets: `research/billing-backend-surface.md`, `research/pricing-margin-analysis.md`, `prototype/plans-prototype.html`, `prototype/billing-prototype.html`)

## Contexto

O ADR 0005 desenhou o Workspace. Faltava o eixo de **monetização**: como o autor vira cliente pagante, o catálogo de planos, o trial de entrada, e a superfície de gestão do que já se tem. O research (ticket 03) revelou que o backend expõe hoje **só duas rotas** de billing (checkout + entitlement) e que **preços e catálogo divergiam** entre a landing e o backend, sem fonte de verdade única. Esta ADR fixa o modelo de billing, o catálogo canônico (fundamentado em margem), e a mecânica do free trial.

## Decisões

### 1. Superfície de backend existente (ticket 03)

O front pode assumir, hoje, apenas:
- **`GET /me/billing/entitlement` → `BillingEntitlementView`** (`billing.getEntitlement()`): resumo de saldo/quota (`planId, tier, status, availableCredits, monthlyCreditsRemaining, canonicalCreditCost, quotaRemaining, quotaLimit, currency?`).
- **`POST /me/billing/checkout` → `BillingCheckoutResponse`** (`billing.createCheckout()`): **modelo redirect** — devolve uma `url` de checkout hospedado; o resultado chega por **webhook**. `internalRef === "free"` é rejeitado. Roteamento determinístico por moeda: **BRL → ASAAS**, **USD → Stripe** (`resolveGatewayForCurrency`); métodos card + pix (pix só BRL).

Tudo o mais que uma UI de billing precisa **não existe como rota** (ver Decisão 6).

### 2. Fim do plano free → free trial (ticket 13)

**Não há mais plano free.** No lugar, um **free trial** como tier de entrada:
- **Início no signup · 7 dias · 5 gerações no total** (pool, não diário); **acaba no que vier primeiro** (5 gerações OU dia 7).
- **Full no trial** (é o gancho de conversão — a qualidade da Cultiv é o que vende): Perfil de Voz completo **sem teto de confiança**, refinamento (conta contra as 5), todos os formatos, mesmos `allowedModels` dos pagos. **Único limite forte = volume de gerações.**
- **Status `trialing`** (já existe em `BillingPlanStatus`).
- **Pós-expiração (híbrido, tiered):** conta + voz + histórico **preservados**, geração travada (paywall) — o perfil de voz é o gancho de reconversão. Purga por inatividade, **com aviso**: **90 dias** para quem nunca converteu · **12 meses** para quem já assinou e depois cancelou/lapsou. Distinto do reset/excluir do usuário (ADR 0005 §7).

### 3. Catálogo canônico reconciliado — backend é SSOT (ticket 14)

Os catálogos da landing (`constellation.ts`) e do backend (`default-plans.ts`) divergiam em tudo. **Reconciliados num catálogo canônico único no backend** (SSOT absoluto); a landing passa a **ler dele**. Números **fundamentados em margem + benchmark** (`research/pricing-margin-analysis.md`), não em chute:

| Plano | id | Preço BRL / USD | Gerações/mês | Margem |
| :-- | :-- | :-- | --: | --: |
| Explorador | `explorador` | R$49 / $9 | 15 | 69% |
| Criador ⭐ | `criador` | R$99 / $19 | 30 | 71% |
| Profissional | `profissional` | R$249 / $49 | 80 | 70% |

- **Margem-alvo 67,5%** mantida (`DEFAULT_TARGET_MARGIN`) — validada como saudável para produto AI-native (benchmark 2026: AI-native 50–60%; 67,5% dá colchão contra custo real vir acima do teórico). Anual **−20%**.
- **Reajuste só no topo:** Explorador/Criador ficam (aquisição + conversão); Profissional subiu $39→$49 (headroom competitivo vs. Jasper Pro $69, ancora a escada).
- **Sem cap diário em nenhum plano** (o usuário pode gastar o pool num dia); no máximo teto semanal/mensal. Não usar `plan.dailyCredits`.
- **Crédito variável por content-type × quality-mode** (`deriveCreditPrice`, já existe) protege a margem: gerações caras (strict/long-form) queimam mais créditos. O "N gerações/mês" exibido é uma **aproximação em balanced mix**.

### 4. Planos / upgrade + checkout (ticket 09)

Rota `/planos` = **porta de compra** (asset `prototype/plans-prototype.html`):
- **Banner de trial** (dias/gerações restantes), 3 tiers (Criador destacado), toggle **mensal/anual** + **BRL/USD**, features por tier, link discreto pra **top-up** avulso.
- **Checkout = redirect:** `createCheckout({ productKind, internalRef, currency, billingPeriod, paymentMethod })` → redireciona ao gateway → **retorno via re-consulta de `entitlement`** com estados **sucesso / pendente / falha** ("nada cobrado"). `internalRef` segue a convenção `{planId}_{period}_{currency}` (3×2×2 + top-ups) e resolve gateway-side.
- **Gatilhos de upgrade contextuais** (paywall que preserva o contexto): `trial_expired` (5 gerações ou dia 7), `usage_restricted`, `low_balance`, `calibration_limit`.

### 5. Billing (gestão) (ticket 10)

Rota de **gestão** do que já se tem, distinta do `/planos` (asset `prototype/billing-prototype.html`):
- **Saldo é o herói, sem jargão:** "~N textos" (`quotaRemaining` = créditos ÷ `canonicalCreditCost`).
- **Extrato = vista curada, não o ledger cru:** colapsa o churn contábil `reserve → capture → release` num só **"Geração"**; mostra só o que o autor entende (créditos do mês, acumulados, compra, geração, estorno, expiração).
- **Plano + método de pagamento + cancelar/reativar.** Comprar/trocar plano **salta pro `/planos`** (fronteira 09↔10).
- **Quatro estados:** em teste · ativo · **pagamento pendente** (dunning: "regularize, créditos seguem por enquanto") · **cancelada-ainda-no-ciclo** (acesso até o fim do período pago, depois lapso→paywall; reativável).

### 6. Contratos e operações a construir (consolidado — implementar é out of scope, especificar não)

Nada disto existe hoje (nem rota, alguns nem operação no `packages/payments`) — o front projeta contra o contrato especificado:
- **`GET /billing/plans` (público) + `GET /me/billing/plans` (autenticado)** — catálogo com preço. Campos: `id, tier, name, tag, monthlyGenerations, monthlyCredits, featured, features[], prices: Record<currency, Record<period, { amount, per, annualNote, internalRef }>>`. A variante `/me/` marca o plano atual. Público porque a **landing consome no build**.
- **Extrato/ledger** (`BillingLedgerEntry` existe; rota não).
- **Gestão de assinatura** — cancelar/trocar/reativar/método de pagamento — **não existe nem como operação** no `payments`; 100% a construir.
- **Listagem de top-up** (`BillingTopUpPackage` existe; rota não).
- **Gate de trial no entitlement:** hoje `canGenerate = status === "active" && availableCredits > 0` — **precisa liberar `trialing`** (idem `canRefine`).
- **`default-plans.ts` reescrito:** sem free; + trial; nomes/créditos/preços/`allowedModels` canônicos (os atuais `llama3.1`/`gpt-4o-mini` estão velhos).
- **Alinhamento landing → backend:** `constellation.ts` + JSON-LD (`seo.ts`) gerados **no build** a partir de `GET /billing/plans` — SEO permanece **estático** (nada de fetch em runtime).

### 7. Emenda ao ADR 0005 §3 (costura trial × onboarding)

O ADR 0005 §3 diz "confirmar o perfil = destrava a geração". **Com o trial, a geração destrava LIMITADA** (5 gerações / 7 dias). A **expiração do trial é um novo gate** (paywall) ao lado de voz + consentimento. O usuário calibra **dentro** do trial; o relógio conta desde o signup (o Perfil de Voz é entrega de produto). Os estados de voz do shell (ADR 0005 §2) ganham a dimensão ortogonal de billing (`trialing`/`active`/`past_due`/`canceled`).

## Alternativas consideradas e rejeitadas

- **Manter o plano free:** o time decidiu (validado com usuários) que free não fazia sentido; o trial dá o gosto sem canibalizar a conversão (ticket 09/13).
- **Cap diário de gerações:** engessa o autor que planeja a semana num dia. Pool sempre; no máximo teto semanal/mensal (ticket 13).
- **Números da landing como catálogo (10/100/ilimitado):** margem-inviável (Criador 100 = 2,6%; "ilimitado" = risco aberto). Recalibrado por margem (ticket 14).
- **Reajustar todos os preços:** só o topo tem headroom competitivo e comprador menos sensível; mexer em aquisição/conversão é arriscado (ticket 14).
- **Baixar a margem por ser "early-stage":** o custo aqui é teórico; a folga de 67,5% é o colchão contra custo real. A alavanca de generosidade é a **cota**, não a margem (ticket 14).
- **Preços na landing como fonte de verdade:** gera divergência entre superfícies; backend SSOT, landing derivada no build (ticket 14).
- **Checkout embedded:** o backend só faz redirect hospedado; embedded seria reescrita sem ganho no v1 (ticket 03/09).

## Consequências

- **Uma dependência grande de backend** (§6) — catálogo, ledger, gestão de assinatura, gate de trial — especificada aqui, a implementar depois. O checkout (redirect) e o entitlement já existem.
- **Coerência:** com ADR 0004 (o paywall usa os gatilhos, intent invisível), ADR 0005 (emendado no §7; o billing é a dimensão ortogonal do gate de entrada) e ADR 0003 (contratos reusados).
- **Landing e backend deixam de divergir** — um SSOT (backend), a landing derivada no build.
- **Custos são teóricos** (`theoretical-cost.ts`); o `telemetry-ingest.ts` existe pra recalibrar com custo **observado** quando houver volume — a margem e as cotas devem ser revisitadas com dados reais.
- **Protótipos são descartáveis** — linkados como assets, reescritos de verdade na implementação.

---

## Pressão surfada pela ADR 0010 — Practice Profile (2026-07-21) — QUESTÃO ABERTA, não resolvida

A ADR 0010 **não** reabre pricing. O toque é menor (o compositor já precifica por `planSignature`; preço por tamanho não muda). Fica **aberta uma questão**: se algum domínio precisar de **passos de pipeline diferentes** (ex.: verificação para texto jurídico = crédito adicional), isso encosta aqui. **Nada sinaliza isso hoje** — registrado como questão aberta, não decisão.
