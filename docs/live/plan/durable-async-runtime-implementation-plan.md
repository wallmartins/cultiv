# Durable Async Runtime — Plano de implementação

**Objetivo:** Eliminar estado de negócio em RAM no backend e waitlist; async-first com PostgreSQL (SoR), Redis (fila + SSE), outbox transacional e workers desacoplados — desde o MVP deployável.

**Origem:** Sessão de arquitetura (2026-06-14) + [ADR 0004](../../adr/0004-durable-async-runtime-zero-in-process-state.md)

**Duração estimada:** 3–5 semanas (1–2 devs backend)

**Governança:**

- PRD: [`durable-async-runtime.md`](../prd/durable-async-runtime.md)
- Parent issue: [`issue-durable-async-runtime.md`](../prd/issue-durable-async-runtime.md)
- ADR: [`0004-durable-async-runtime-zero-in-process-state.md`](../../adr/0004-durable-async-runtime-zero-in-process-state.md)
- Issues: [`48`–`57`](../issues/README.md#durable-async-runtime)

**Pré-requisitos:**

- Migrations PostgreSQL existentes (`jobs`, `audit`, voice, users)
- Rotas `/me/executions/*` e client-sdk watch resilience
- Entitlements e quality modes (issues 35–38)

---

## 1. Definition of Done (programa completo)

- [ ] `docker compose` (ou doc equivalente) sobe PostgreSQL + Redis para dev
- [ ] `DATABASE_URL` + `REDIS_URL` obrigatórios fora de unit tests puros
- [ ] Billing durável em PostgreSQL; zero `createBillingRepository()` in-memory em runtime
- [ ] Jobs: API e workers leem/escrevem PostgreSQL; `job-store` Map removido como SoR
- [ ] Tabela `outbox` + relay publica em Redis após commit
- [ ] Workers em processo separado (BullMQ consumer)
- [ ] `POST` async: transação única job + reserva crédito + outbox
- [ ] SSE via Redis; qualquer réplica API entrega eventos
- [ ] Rate limit HTTP, traffic limit e idempotency duráveis (Redis ou PG)
- [ ] Waitlist web sem `Map` in-memory
- [ ] Testes CI: restart API, multi-réplica SSE, billing sobrevive restart
- [ ] Issue 57 (gate HITL) aprovada

**Fora do DoD:** Cassandra, multi-região, autoscaling K8s, edge WAF provisioning automatizado.

---

## 2. Arquitetura alvo

```
┌─────────────────────────────────────────────────────────────────┐
│ Edge (WAF / CDN) — rate limit IP, bot mitigation                   │
└───────────────────────────────┬─────────────────────────────────┘
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│ API tier (stateless, N replicas)                                 │
│  POST /me/executions/run → PG txn (job + reserve + outbox)       │
│  GET /me/executions*     → PG                                    │
│  GET .../events (SSE)    → subscribe Redis                       │
└───────┬─────────────────────────────────────┬───────────────────┘
        │                                     │
        ▼                                     ▼
┌───────────────┐                    ┌────────────────┐
│ PostgreSQL    │                    │ Redis (AOF)    │
│ jobs billing  │◄── outbox relay ──►│ BullMQ queue   │
│ outbox audit  │                    │ SSE pub/sub    │
│ voice users   │                    │ rate counters  │
└───────────────┘                    └────────┬───────┘
                                              ▼
                                     ┌────────────────┐
                                     │ Worker tier    │
                                     │ pipeline + PG  │
                                     │ terminal state │
                                     └────────────────┘
```

### Princípios

| Princípio | Regra |
|-----------|--------|
| **Uma fonte por conceito** | Job status → PG; fila → Redis alimentada por outbox |
| **Commit antes de 202** | Nenhum `202` sem job + reserva + outbox persistidos |
| **Worker idempotente** | `executionId` + estado PG evita dupla execução |
| **Progresso leve** | SSE/Redis para ticks; PG só marcos + terminal |
| **Falha barulhenta** | Persistência crítica não usa `swallowWithDiagnostic` |

---

## 3. Estado atual → alvo

| Componente hoje | Alvo |
|-----------------|------|
| `job-store.ts` Map | Adapter PG + eventos Redis |
| `worker.ts` `queueMicrotask` | BullMQ consumer process |
| `packages/payments` Maps | Repositories PostgreSQL |
| `usage-policy` traffic Map | Redis TTL ou PG |
| `rate-limiter.ts` Map | Redis ou PG + edge |
| `execution/index.ts` idempotency Map | Tabela PG unique |
| `memory-store` L1 | Read-through PG ou remover L1 |
| `persistQueuedJob` best-effort | Mesma transação do POST |
| Reserva crédito no worker | Reserva no POST |
| SSE listeners in-process | Redis pub/sub |

---

## 4. Schema novo (esboço)

### `outbox`

| Coluna | Tipo | Notas |
|--------|------|-------|
| `id` | uuid PK | |
| `aggregate_type` | text | ex. `execution` |
| `aggregate_id` | text | `executionId` |
| `event_type` | text | `ExecutionEnqueued`, `ExecutionProgressed`, … |
| `payload` | jsonb | |
| `occurred_at` | timestamptz | |
| `published_at` | timestamptz null | null = pendente relay |

Índice parcial: `WHERE published_at IS NULL` para poll do relay.

### Billing (issue 49 — detalhar na migration)

- `billing_subscriptions`, `billing_ledger_entries`, `billing_reservations`, `billing_idempotency_keys` (nomes finais na issue)

### `execution_idempotency` (issue 55)

- `idempotency_key` + `user_id` unique → `execution_id`, `fingerprint`, `created_at`

---

## 5. Fases e issues

### Fase A — Fundação (semana 1)

| Issue | Entrega |
|-------|---------|
| **48** | Compose PG+Redis, validação env, remover fallbacks memory em runtime deployável |
| **49** | Billing PostgreSQL |
| **50** | Job SoR PostgreSQL; rotas leem PG |

### Fase B — Fila e transação (semana 2)

| Issue | Entrega |
|-------|---------|
| **51** | Migration outbox + relay worker |
| **52** | BullMQ + processo worker separado |
| **53** | POST atômico job + reserva + outbox |

### Fase C — Observabilidade e limites (semana 3)

| Issue | Entrega |
|-------|---------|
| **54** | SSE multi-réplica via Redis |
| **55** | Rate limit, traffic, idempotency duráveis |
| **56** | Waitlist web alinhada |

### Fase D — Verificação (semana 3–4)

| Issue | Entrega |
|-------|---------|
| **57** | Testes restart + multi-réplica + checklist HITL |

**Ordem sugerida:** `48 → (49 ∥ 50) → 51 → 52 → 53 → 54 → 55 → 56 → 57`

---

## 6. Cenários de escala (referência)

| Estágio | Gerações/dia | Infra mínima | Gargalo esperado |
|---------|--------------|--------------|------------------|
| MVP | &lt; 1k | 1 API, 1 worker, PG small, Redis single | Provider IA |
| Early | 1k–10k | 2–3 API, 2–5 workers | Workers / quota provider |
| Growth | 50k–200k | Autoscale workers, PgBouncer | Provider + fila |
| Scale | 500k+ | Partição `jobs`/`outbox`, read replica histórico | Custo IA |
| Global | 10M+ | Regiões + edge; PG por região ou primário único | Multi-região (fora deste programa) |

PostgreSQL com 4–6 writes por geração (modelo outbox) suporta **Growth** com particionamento; não exige Cassandra no core.

---

## 7. Riscos e mitigações

| Risco | Mitigação |
|-------|-----------|
| Dual-write durante migração | Feature flag: ler PG, deprecar Map numa PR dedicada (50) |
| Relay duplica mensagem | At-least-once + worker idempotente |
| Dev sem Docker | Documentar compose obrigatório; CI usa service containers |
| Write amplification audit | Remover audit por progress tick (ADR) |
| Redis sem AOF perde fila | Outbox re-publica; documentar AOF em prod |

---

## 8. Verificação manual (pré-gate 57)

1. `docker compose up` → backend conecta PG + Redis
2. `POST /me/executions/run` → `202` → matar API → `GET` ainda mostra job
3. Subir 2ª réplica API → SSE no drawer recebe progresso
4. Reiniciar worker → job completa ou falha terminal sem crédito fantasma
5. `pnpm test` — suite issues 48–56 verde
6. Grep: sem `new Map` de domínio em `apps/backend/src` (exceto testes)

---

## 9. Referências

- [ADR 0004](../../adr/0004-durable-async-runtime-zero-in-process-state.md)
- [Archived production readiness](../../archive/plans/backend-production-readiness.md)
- Client SDK: `tests/client-sdk/execution-watch-resilience.test.ts`
- Código atual: `job-store.ts`, `queued-run.ts`, `persistence-jobs.ts`, `worker.ts`
