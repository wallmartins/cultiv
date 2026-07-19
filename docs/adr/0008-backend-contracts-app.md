# Contratos de Backend do `/app`

**Status:** accepted
**Complementa:** ADR 0006 (materializa os contratos de billing/trial/catálogo), 0007 (fecha o apêndice de contratos — os gaps classe-b/c saem de "stub" para contrato concreto); relaciona 0004 (prefill de geração) e 0005 (escada destrutiva)
**Trilha de decisão:** `.scratch/contratos-backend-app/` (mapa wayfinder "Contratos de backend do `/app` — do gap ao contrato implementável" + tickets 01–09 e assets em `research/`: `survey-backend.md`, `contract-02-status-entitlement.md`, `contract-03-ciclo-vida.md`, `contract-04-catalogo-topup.md`, `contract-05-ledger.md`, `contract-06-execucoes.md`, `contract-07-prefill.md`, `contract-08-account-ops.md`)

## Contexto

O apêndice de contratos da ADR 0007 listou 11 gaps de backend que o frontend do `/app` depende, classificados **a** (derivável client-side), **b** (precisa de contrato, v1 funciona com stub) e **c** (trava a feature real). A decisão de 2026-07-13 (registrada na ADR 0007, "Regra revisada") foi implementar **classe-c + classe-b antes da UI dependente** — nada ships desabilitado — o que redesenhou o escopo (o backend estava fora do mapa de frontend) e virou um **esforço próprio**.

Esse esforço especificou cada contrato como spec `/implement`-ready (Effect Schema em `packages/contracts` + shape de rota/persistência, ancorado na infra existente — `packages/payments`, execuções, `auth/`). Esta ADR **consolida** as decisões dos 8 tickets num registro canônico e é a âncora arquitetural que o plano de execução (`docs/live/plan/backend-contracts-plan.md`) referencia. **Este mapa planejou, não construiu** — a saída é a spec + o plano; o `/implement` backend executa depois.

> **Escopo:** só os contratos que o `/app` web depende (classe-b + classe-c do apêndice da ADR 0007). Classe-a (#9 appMode, #10 prefs) fica com o frontend (derivável client-side). Ver "Fora de escopo".

## Decisões

As decisões detalhadas vivem nos tickets/assets do mapa (linkados por referência — esta ADR indexa, não re-enuncia). O esqueleto travado:

### 1. Status de assinatura & entitlement (#8) — a base [ticket 02]

`contract-02-status-entitlement.md`. Estende `BillingEntitlementViewSchema` **in place** (mesma rota `GET /me/billing/entitlement`): `status` tipado de **5 valores** (`trialing·active·past_due·canceled·lapsed`, `lapsed` explícito) + **`canGenerate` boolean + `gate` tipado** (`ok·no_credits·trial_expired·past_due·lapsed`) — o paywall lê o gatilho do servidor, não deriva no client. Corrige a semântica errada de `canGenerate` (hoje `status==="active"&&credits>0`, trava trial + canceled-no-ciclo). É o contrato de maior alavancagem: destrava o gating real de geração/planos/billing/shell.

### 2. Catálogo & top-up (#3 + #5) [ticket 04]

`contract-04-catalogo-topup.md`. `PlanCatalogView` (`GET /billing/plans` público + `/me/billing/plans` auth) + `BillingTopUpCatalogView` — preços em **cents**, anual −20% **computado no backend**. Decisões travadas: **preço canônico mora no `default-plans.ts`** (backend é SSOT — materializa a ADR 0006 §3, não puxa do gateway); **trial = grant de créditos variável `ceil(5×custo canônico)`** (não contador duro de 5; banner vira aproximado). Exige reescrever o `default-plans.ts` stale — que também é o produtor do seed `trialing` (construído no ciclo de vida).

### 3. Ciclo de vida da assinatura (#6 + N2) [ticket 03]

`contract-03-ciclo-vida.md`. **Premissa checada:** manter os **dois gateways** (ASAAS BRL + Stripe USD) — Stripe-only virou viável em 2026 (Pix Automático) mas não p/ SaaS BR-first mid-ticket. Modelo = **flags de capacidade por gateway** (`management` na view; a UI mostra só o aplicável). `accessUntil`/`renewsAt` = **clock de ciclo interno é o master** (uniforme p/ os dois gateways). Dunning = **refletir o nativo** dos gateways (mapear eventos, sem engine de retry). Regularizar = **re-superfície da fatura em aberto** (`regularizeUrl`). Money ops = **Stripe via Customer Portal / ASAAS in-app** (só cancel v1). N2 retorno de checkout = **`GET /checkout-status/:intentId` = verdade de servidor** (param de URL é inseguro). Fim do trial = **pool esgotado ou dia 7, o que vier primeiro**. Constrói os **produtores** que o #8 herdou (seed `trialing`, clocks lazy `→lapsed`, `everSubscribed`).

### 4. Ledger curado (#4) [ticket 05]

`contract-05-ledger.md`. `LedgerStatementView` — colapsa `reserve→capture→release` num único "Geração"; expõe as 6 categorias legíveis. **Curadoria mora no backend** (novo `packages/payments/src/statement.ts`); o `curateLedger` do front é deletado. 5/6 categorias reconstroem do ledger cru; "estorno" = `release`-sem-`capture` (o `entryType:refund` não tem produtor).

### 5. Gaps de execuções (#1 + #2 + N3) [ticket 06]

`contract-06-execucoes.md`. **#1 busca** por `briefingTopic` — denormalizar em `data.briefingTopic` no enqueue **com backfill**. **#2 reação** 👍/👎 — tabela dedicada `execution_reactions`, só estado atual mutável (streak fora do v1). **N3 cancelar** — `cancelled` no `JobStatusSchema`, **best-effort v1** (marca + libera a reserva; worker termina no vazio, idempotência evita double-spend).

### 6. Prefill de geração (N1) [ticket 07]

`contract-07-prefill.md`. Veredito **greenfield** — a rota/serviço não existem (só `GeneratePrefillSchema` dead-code); a "contradição C1" do breakdown 08 nunca foi real (ADR 0004 §6 especifica como trabalho novo). Contrato: `POST /me/generation-prefill` + serviço stateless reusando `reasoning-extraction.ts`.

### 7. Account ops LGPD (#7) [ticket 08]

`contract-08-account-ops.md`. Escada destrutiva. **Reset** mantém a carteira (apaga voz+histórico+memories, re-onboarding). **Exclusão** hard-deleta os dados pessoais mas **anonimiza + retém o ledger financeiro** (fiscal/LGPD Art. 16 — a única mutação sancionada do store append-only); assinatura ativa **auto-cancela no gateway → purga → Auth0**; conta vira **tombstone** (`status="deleted"`, bloqueia ressurreição por token); cascade = **txn Postgres local + retry durável do Auth0**; type-to-confirm **re-validado no servidor**. **Export** = async → signed URL, JSON com exemplos **decriptados** + billing. Reset/delete **cancelam gerações em curso (N3) + flush Redis** antes da purga.

## Invariantes de governança (load-bearing)

- **Effect-hardening.** Todo contrato vive em `packages/contracts` (só depende de `effect`); **proibido** `throw new Error`, `Schema.decodeUnknownSync`, contratos tipados como `Promise`. Erro/async modelados como valores Effect. Decoders via `createSchemaDecoder`. Ver `tests/governance/effect-hardening-governance`.
- **Extend-before-rebuild (ponytail).** `packages/payments` é rico — os contratos de billing são **estender + expor**, não greenfield. Exceções greenfield explícitas: prefill (N1), reação (#2), account ops (#7), o cliente Auth0 Management.
- **Não reabrir produto.** A ADR 0006 fixou pricing/trial/catálogo; estes contratos **materializam**, não redecidem. Contradições surfadas, não sobrescritas (ex.: preço não morava no backend → materializado no `default-plans.ts`).

## Ordem de implementação

O plano ordenado `/implement`-ready vive em **`docs/live/plan/backend-contracts-plan.md`**. Resumo do grafo: **Status (#8) é a base** → **Catálogo (#3/#5)** define o grant de trial que a **Ciclo de vida (#6/N2)** consome → **Ledger (#4)**, **Execuções (#1/#2/N3)** e **Prefill (N1)** são independentes (paralelos) → **Account ops (#7)** por último (reusa o N3 de execuções + o cancel programático do Stripe do ciclo de vida).

## Consequências

- O `/implement` backend tem um plano ordenado (`docs/live/plan/backend-contracts-plan.md`) e esta ADR como âncora; nenhuma decisão de contrato pendente. As superfícies de frontend classe-b/c destravam conforme cada contrato aterrissa (ver ADR 0007 apêndice + `frontend-implementation-plan.md` Fase −1).
- **Deltas de persistência** (migrações): `+lapsed` no enum de status; `trial_ends_at`/`renews_at`, `payment_method_kind`/`brand_last4`, `everSubscribed`, `outstanding_invoice_url` (billing); `+failed` no checkout-intent; `execution_reactions` + `data.briefingTopic` (execuções); `status="deleted"`/`deleted_at` (contas). Nenhuma viola o append-only de billing exceto a anonimização sancionada da exclusão.
- **Novas dependências externas:** cliente Auth0 Management (M2M) — hoje Auth0 é só validação de JWT.
- **`everSubscribed`** é produzido no ciclo de vida (#6) e servido a três consumidores: o gate (#8), a purga de inatividade (ADR 0006 §2) e a distinção `trial_expired`×`lapsed`. Produzir uma vez, servir os três.
- A trilha completa (o porquê de cada decisão) fica no mapa wayfinder em `.scratch/contratos-backend-app/`.

## Alternativas descartadas

- **Stripe-only (um gateway).** Pesquisa de premissa (ticket 03): tecnicamente viável em 2026 (Pix Automático GA), mas p/ um SaaS BR-first a R$49–249 vendendo BR+global perde parcelado (12×), NFS-e automática e settlement rápido de cartão. O padrão de mercado é gateway local recorrente + Stripe USD — a arquitetura atual. Mantidos os dois gateways.
- **Modelo uniforme lowest-common-denominator** para os money ops (backend fingindo os ops que um gateway não faz nativo). Rejeitado em favor de flags de capacidade por gateway — menos ficção; um PIX-anual-parcelado genuinamente não é uma assinatura cancelável.
- **Hard-delete do billing na exclusão de conta.** Viola o invariante append-only + a retenção fiscal brasileira. Substituído por anonimizar + reter (LGPD Art. 16).
- **Contagem dura de 5 gerações no trial.** Rejeitada em favor do grant de créditos variável (`ceil(5×custo)`) — reusa a máquina de wallet/quota sem novo mecanismo.
- **Engine de dunning própria.** Rejeitada — refletir o dunning nativo dos gateways (evita double-dunning).

## Fora de escopo

- **Classe-a (#9 appMode, #10 prefs)** — o frontend deriva client-side; volta como esforço fresco só se exigir persistência server-side de fato.
- **Job de purga de inatividade** (ADR 0006 §2, 90d/12mo) — usa o `everSubscribed` e deve **reusar o cascade da exclusão** (ticket 08), mas é background job, não gap de contrato do frontend. Esforço separado.
- **Trocar o gateway BR (ASAAS → Vindi/Iugu)** — eles têm primitivas de lifecycle/dunning nativas que faltam no ASAAS; decisão de infra/produto, além de materializar contratos sobre a infra existente.
- **NFS-e para receita USD-Stripe** — tributação internacional.
