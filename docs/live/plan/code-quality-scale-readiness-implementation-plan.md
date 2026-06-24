# Code Quality and Scale Readiness — Plano de implementação

**Objetivo:** Corrigir gaps de confiabilidade, escala, acessibilidade e manutenibilidade identificados no code review completo de 2026-06-24 — sem alterar comportamento de produto que usuários já dependem.

**Origem:** Code review full-stack (backend, frontend, packages)

**PRD:** [`code-quality-scale-readiness.md`](../prd/code-quality-scale-readiness.md)  
**Issues:** [`README-code-quality-scale-readiness.md`](../issues/README-code-quality-scale-readiness.md) (88–108)

**Disciplina:** TDD onde há lógica não trivial; governança existente (`file-size-governance`, `frontend-client-boundary`, `dependency-governance`) deve permanecer verde.

---

## 1. Objetivo

O monorepo Cultiv tem arquitetura madura (contracts, Effect-TS, safety, client-sdk boundary), mas acumulou padrões de **early stage** que:

- mascaram falhas de infraestrutura
- não escalam com volume de jobs/billing
- geram bugs de UX (histórico, i18n auth)
- aumentam custo de manutenção (boilerplate, god-components, copy-paste)

Este programa trata a dívida em **8 fases paralelizáveis**, priorizando impacto operacional.

| Princípio | Aplicação |
|-----------|-----------|
| **Vertical slices** | Cada issue entrega caminho completo verificável (contrato → API → UI → teste) quando aplicável |
| **Sem regressão** | Comportamento observável preservado; mudanças internas com testes de paridade |
| **Lazy senior** | Menor diff que resolve a causa raiz; sem abstrações não solicitadas |
| **Governança** | `GenerationScreen` e novos módulos respeitam orçamento de 400 linhas |

**Fora do escopo:** features de produto novas, multi-region, suite E2E Playwright, CSP em código app.

---

## 2. Fases

### Fase A — Confiabilidade backend (Semana 1)

**Meta:** falhas de DB observáveis; billing no worker eficiente; JIT sem write em todo request.

| Issue | Entrega |
|-------|---------|
| **88** | `DatabaseError` propagado; repos não engolem erros de query |
| **89** | Reload billing por `userId` no worker (não snapshot global) |
| **90** | `ensureDefaultFreeSubscription` só no create path do Application User |

**Risco mitigado:** incidentes silenciosos; worker O(n) billing.

**Dependências:** 89 beneficia de 88 (erros de reload visíveis).

---

### Fase B — UX workspace correta (Semana 1–2)

**Meta:** histórico confiável; locale bilíngue no auth; modais acessíveis.

| Issue | Entrega |
|-------|---------|
| **91** | Filtros `period`/`status`/`contentType` na API + SDK + hook; `hasMore` correto |
| **92** | Strings auth/callback em `messages`; `document.lang` no workspace |
| **93** | `AppModal` com focus trap, Escape, `aria-labelledby`; migrar 2 modais |

**Risco mitigado:** lista vazia com paginação; EN users em PT no login.

---

### Fase C — Manutenibilidade frontend (Semana 2–3)

**Meta:** telas menores; fetch compartilhado; bundle menor.

| Issue | Entrega |
|-------|---------|
| **94** | `GenerationScreen` ≤ 400 linhas ou steps roteados |
| **101** | `React.lazy` nas rotas `/app/*` pesadas |
| **102** | `useSdkQuery` mínimo; migrar history + content-types |

**Nota:** 102 bloqueado por 91 para migrar `useExecutionsList` com filtros na API.

---

### Fase D — Segurança e custo LLM (Semana 2)

| Issue | Entrega |
|-------|---------|
| **95** | ADR/decisão Auth0 `cacheLocation`; implementação |
| **96** | Cap de concorrência em text-quality lanes (default 3) |

**95 é HITL** — decisão de produto/segurança antes do merge.

---

### Fase E — Packages hygiene (Semana 2–3)

| Issue | Entrega |
|-------|---------|
| **97** | `listByUser`/`countByUser` filtram por userId; alinhar governance `text-quality → skills` |
| **98** | Factory OpenAI-compatible para providers |
| **105** | Consolidar tipos Voice Profile (HITL — ADR + mappers) |

---

### Fase F — DX backend (Semana 3–4)

| Issue | Entrega |
|-------|---------|
| **99** | `createPublicRoute` helper; refatorar 3+ rotas piloto |
| **100** | Remover rota policies duplicada; Routes enum em voice; limpar `dist.bak.*` |
| **106** | Deprecar/remover `POST /api/run` após auditoria SDK |

**106 bloqueado por 100** (limpeza de superfície legacy).

---

### Fase G — Cobertura de testes (Semana 3–4)

| Issue | Entrega |
|-------|---------|
| **103** | Testes RTL: auth gate, modal, history hook |
| **104** | Testes webhook Stripe/Asaas: assinatura inválida, replay idempotente |

### Fase H — Escala e governança web (Semana 5)

| Issue | Entrega |
|-------|---------|
| **107** | API boot não carrega todas billing tables; read-through ou cache por usuário |
| **108** | `file-size-governance` estende para `apps/web/src` com allowlist inicial |

**107 bloqueado por 89** — worker path primeiro. **108 bloqueado por 94** — reduz violadores antes de ligar CI.

---

## 3. Grafo de dependências

```
                    ┌── 90 (JIT subscription)
                    │
88 (PG errors) ─────┼── 89 (billing reload)
                    │
                    └── 99 (route helper) ── 100 (route cleanup) ── 106 (legacy /api/run)

91 (history filters) ── 102 (useSdkQuery)

92 (auth i18n) ──┐
                 ├── 103 (component tests)
93 (modal) ──────┘

94, 96, 97, 98, 101, 104 — independentes (podem rodar em paralelo)

95, 105 — HITL (decisão humana)

89 ──→ 107 (billing API boot lazy-load)
94 ──→ 108 (web file-size governance)
```

---

## 4. Ordem de execução sugerida

**Sprint 1 (crítico):** 88, 90, 91, 92  
**Sprint 2 (escala + UX):** 89, 93, 96, 97  
**Sprint 3 (DX + perf):** 94, 98, 99, 101, 102  
**Sprint 4 (hardening):** 100, 103, 104, 106  
**Sprint 5 (escala):** 107, 108  
**Paralelo quando disponível:** 95 (HITL), 105 (HITL)

---

## 5. Critérios de done do programa

- [ ] Zero `catchAll → succeed(empty)` em falhas de query Postgres (exceto paths documentados de idempotência)
- [ ] Worker não chama reload global de billing por job
- [ ] `GET /me/executions` suporta filtros; frontend não filtra página já paginada
- [ ] Auth strings no catálogo i18n; `document.lang` segue App Locale em `/app/*`
- [ ] `AppModal` usado em consent e delete modals
- [ ] Text-quality concurrency cap configurável e testada
- [ ] `database.listByUser` filtra por userId
- [ ] Governance tests verdes após alinhamento text-quality/skills
- [ ] `pnpm test:ci` verde
- [ ] API boot não faz full billing table scan (issue 107)
- [ ] `apps/web` no file-size governance com allowlist controlada (issue 108)

---

## 6. Backlog externo ao programa

- **E2E Playwright** — fluxo auth → generate → watch (iniciativa separada)
- **CSP** — runbook de infra Vercel/Cloudflare

---

## 7. Referências

- Code review: conversa 2026-06-24
- Architecture Deepening: [`architecture-deepening-plan.md`](./architecture-deepening-plan.md)
- ADR 0004: runtime durável
- ADR 0028: client-sdk como superfície de integração
- Decisões Web v2: [`decisions.md`](./decisions.md) (TanStack Query planejado)
