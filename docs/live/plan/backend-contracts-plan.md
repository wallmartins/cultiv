# Plano de implementação dos contratos de backend do `/app` — ordenado, `/implement`-ready

> Âncora arquitetural: **ADR 0008** (+ ADRs 0006/0007). Trilha completa: mapa wayfinder `.scratch/contratos-backend-app/` (tickets 01–09 + `research/*`). Este plano é a **sequência de execução** que o `/implement` backend segue contrato-a-contrato; cada contrato referencia o asset que o detalha (Effect Schema + rota + persistência + tarefas).
>
> É a **Fase −1** do `docs/live/plan/frontend-implementation-plan.md`: conforme cada contrato aterrissa, a superfície de frontend correspondente destrava (nada ships desabilitado).

## Como ler

- Cada contrato tem **id** (`B-*`), **depende de**, e um ponteiro pro asset com o Effect Schema/rota/persistência/tarefas.
- **Governança (invariantes, valem em todo contrato):** Effect-hardening — `packages/contracts` só depende de `effect`; **sem** `throw`/`Schema.decodeUnknownSync`/`Promise` (erro/async como valores Effect; decoders via `createSchemaDecoder`). Extend-before-rebuild — estender `packages/payments`, não greenfield (exceções explícitas: prefill, reação, account ops, Auth0 Management).
- **Não redecidir produto** (ADR 0006) — materializar contratos; contradições surfadas, não sobrescritas.

---

## Os contratos (ordem de execução)

### B-STATUS — Status de assinatura & entitlement (#8) · a base
**depende de:** — · asset [`contract-02-status-entitlement.md`](../../../.scratch/contratos-backend-app/research/contract-02-status-entitlement.md)
O de maior alavancagem e o mais transversal — faça primeiro. Estende `BillingEntitlementViewSchema` in place (`status` tipado de 5 valores, `canGenerate`/`gate`, `accessUntil`/`renewsAt`/`trialEndsAt`/`paymentMethod`). Tarefas: contract + decoders · `+lapsed` no enum `BillingPlanStatus` · reescrever `canGenerate`/`gate` em `entitlement.ts` (**runnable check:** teste puro dos 5 status × gate) · persistência (`trial_ends_at`/`renews_at`/`payment_method_*`/`everSubscribed`) · route assembly (`billing-routes.ts:83-97`) · SDK. **Destrava:** gating real de S3/S7/S8 + inertização do shell.

### B-CATALOG — Catálogo de planos & top-up (#3 + #5)
**depende de:** — (mas **antes** de B-LIFECYCLE: define o grant de trial que ele consome) · asset [`contract-04-catalogo-topup.md`](../../../.scratch/contratos-backend-app/research/contract-04-catalogo-topup.md)
`PlanCatalogView` (`GET /billing/plans` público + `/me/billing/plans` auth) + `BillingTopUpCatalogView` (`GET /me/billing/topups`), preços em cents, anual −20% no backend. Tarefas: schemas · **reescrever o `default-plans.ts` stale** (cents canônicos = SSOT backend; tier de trial com grant `ceil(5×custo canônico)`) · rotas · o rewrite do `default-plans` é o produtor do seed `trialing` (build no B-LIFECYCLE). **Destrava:** S7 (planos) + link de top-up de S8.

### B-LIFECYCLE — Ciclo de vida & retorno de checkout (#6 + N2)
**depende de:** B-STATUS (shape de status), B-CATALOG (grant de trial) · asset [`contract-03-ciclo-vida.md`](../../../.scratch/contratos-backend-app/research/contract-03-ciclo-vida.md)
Flags de capacidade por gateway + os produtores da máquina de estados. Tarefas: `BillingManagementSchema` (+ `management` na view) · `+cancelSubscription` na interface do adapter (impl ASAAS `DELETE /subscriptions/{id}`) · webhooks dunning (Stripe `invoice.payment_failed`→past_due + recovery→active; des-no-opar ASAAS overdue; capturar paymentMethod; persistir `outstanding_invoice_url`) · **produtores** (seed `trialing` reescrevendo `ensureDefaultFreeSubscription` com o grant do B-CATALOG; clocks lazy `→lapsed` — trial `min(pool,dia7)`, cancel `accessUntil`; `everSubscribed`) + sweeper (**runnable check:** teste puro do clock) · rotas `POST /portal-session` (Stripe) + `POST /subscription/cancel` (ASAAS) · `GET /checkout-status/:intentId` + `failed` no intent + `intentId` na return URL · SDK. **Destrava:** S8 (gestão) + retorno real de S7.

### B-LEDGER — Extrato/ledger curado (#4)
**depende de:** — (independente; vizinho do B-STATUS mas não bloqueia) · asset [`contract-05-ledger.md`](../../../.scratch/contratos-backend-app/research/contract-05-ledger.md)
`LedgerStatementView` (colapsa `reserve→capture→release` num "Geração", 6 categorias). Tarefas: schema · `packages/payments/src/statement.ts` (curadoria no backend; soma o net do grupo `generation_cycle`; "estorno" = `release`-sem-`capture`) · rota · (opcional) enrich `topic` no reserve call-site. **Destrava:** extrato de S8.

### B-EXEC — Gaps de execuções (#1 busca + #2 reação + N3 cancelar)
**depende de:** — (independente) · asset [`contract-06-execucoes.md`](../../../.scratch/contratos-backend-app/research/contract-06-execucoes.md)
Tarefas: **#1** `q?` em `ExecutionsListQuerySchema` + **denormalizar `briefingTopic` em `data.briefingTopic`** no enqueue + **migração de backfill** (SQL `data->>'briefingTopic' ILIKE %q%`) · **#2** tabela `execution_reactions` (`unique(user_id,execution_id)`) + `ExecutionReactionView` + `POST`/`DELETE /me/executions/:id/reaction` · **N3** `cancelled` em `JobStatusSchema` + `cancelJob` nos dois job-stores (SSE + `ExecutionQueue.remove`) que **libera a reserva** (best-effort v1; idempotência evita double-spend). **Destrava:** busca/reação de S4 + cancelar de S10.

### B-PREFILL — Prefill de geração (N1)
**depende de:** — (independente) · asset [`contract-07-prefill.md`](../../../.scratch/contratos-backend-app/research/contract-07-prefill.md)
Greenfield. Tarefas: `packages/contracts/src/generation-prefill.ts` · `POST /me/generation-prefill` + serviço stateless reusando `reasoning-extraction.ts` · 8º subclient SDK `generationPrefill.infer`. **Destrava:** prefill de S3.

### B-ACCOUNT — Account ops LGPD (#7) · por último
**depende de:** B-EXEC (N3 cancel de in-flight), B-LIFECYCLE (cancel programático do Stripe + shape de billing p/ anonimizar) · asset [`contract-08-account-ops.md`](../../../.scratch/contratos-backend-app/research/contract-08-account-ops.md)
Tarefas: schemas `account-ops` · bulk `removeByUser` (jobs/memories/`voice_example_batches`) (**runnable check:** apaga um user, preserva outro) · **anonimização de billing** (pseudonimiza link de PII, retém agregados; **runnable check:** PII some, fiscais permanecem) · **tombstone + auth guard** (`status="deleted"`; `findByExternalSubject` recusa) · Auth0 Management M2M + evento outbox com retry · **Stripe `cancelSubscription` programático** (reconcilia c/ B-LIFECYCLE, que usa Portal p/ o usuário) · rotas `POST /export`(+`GET /export/:jobId`)/`POST /reset`/`DELETE /account` (compõem N3) · export builder (decripta exemplos, signed URL) · SDK. **Destrava:** escada destrutiva de S9.

---

## Grafo de dependências

```
B-STATUS ─┬─ B-CATALOG ─ B-LIFECYCLE ─┐
          │                            ├─ B-ACCOUNT
B-EXEC ───┼────────────────────────────┘
B-LEDGER ─┤   (independentes — entram quando houver capacidade)
B-PREFILL ┘
```

**Caminho crítico:** B-STATUS → B-CATALOG → B-LIFECYCLE → B-ACCOUNT. **Paralelos:** B-LEDGER, B-EXEC, B-PREFILL não dependem de nada — podem começar junto com B-STATUS. B-STATUS destrava o gating mais cedo, então é o primeiro a fechar.

## Handoff → frontend (Fase −1 do `frontend-implementation-plan.md`)

Conforme cada contrato aterrissa, a superfície destrava: **B-STATUS** → gating de S3/S7/S8 + shell · **B-CATALOG** → S7 (planos) · **B-LIFECYCLE** → S8 (gestão) + retorno de S7 · **B-LEDGER** → extrato de S8 · **B-EXEC** → busca/reação de S4 + cancelar de S10 · **B-PREFILL** → prefill de S3 · **B-ACCOUNT** → escada destrutiva de S9. O caminho crítico do frontend puro (F1→…→S2→{S4,S5}) não depende de nenhum destes e roda em paralelo.
