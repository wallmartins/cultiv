# Plan tier quality modes — Plano de implementação

**Objetivo:** Corrigir o eixo comercial: formatos abertos para assinantes ativos; modos de execução limitados por tier; assinatura `free` provisionada no JIT.

**Origem:** Conversa de produto (2026-06-12) + gap entre `canRefine` e bloqueio de **Content Types** na **Generation Screen**.

**Duração estimada:** 2–3 dias (1 dev)

**Governança:**

- PRD: [`plan-tier-quality-modes.md`](../prd/plan-tier-quality-modes.md)
- ADR: [`0002-plan-tier-quality-modes-and-default-free-subscription.md`](../../adr/0002-plan-tier-quality-modes-and-default-free-subscription.md)
- Parent issue: [`issue-plan-tier-quality-modes.md`](../prd/issue-plan-tier-quality-modes.md)
- Issues: [`35`–`38`](../issues/README.md#plan-tier-quality-modes)

---

## 1. Definition of Done (programa completo)

- [ ] Todo **Application User** novo recebe assinatura `free` ativa (JIT)
- [ ] `getEntitlement` resolve estado para usuários reais sem seed manual de dev
- [ ] `resolveAllowedQualityModes(tier)` em `packages/payments` com ladder acordada
- [ ] Catálogo `/me/content-types`: formatos `available` com assinatura ativa; sem `canRefine`
- [ ] `generation-preview`: modos `allowed` = tier ∧ ativa ∧ créditos
- [ ] `public-generation`: rejeita modo fora do tier; não bloqueia formato por `canRefine`
- [ ] **Generation Screen**: radios de modo desabilitados conforme preview; fallback automático
- [ ] i18n pt/en para novos `blockedReason` de modo e assinatura
- [ ] Testes backend (payments, preview, content-types) + web (generate UX)

**Fora do DoD:** checkout, novos planos, preço diferente por tier, `/app/billing`.

---

## 2. Arquitetura alvo

```
Auth0 login
    │
    ▼
JIT ApplicationUser create
    │
    ▼
ensureDefaultFreeSubscription(userId)     ← packages/payments
    │
    ▼
/me/content-types  ──► all formats if subscription active
    │
    ▼
generation-preview ──► qualityModes[].allowed
    │                    = canUseQualityMode(tier, mode)
    │                    ∧ subscription active
    │                    ∧ credits >= price
    ▼
executions.create ──► same enforcement (fail closed)
    │
    ▼
Generation Screen ──► disable mode radios; keep formats open
```

### Responsabilidades por pacote

| Camada | Dono de quê |
|--------|-------------|
| `packages/payments` | Planos, créditos mensais, assinatura default, ladder de modos, entitlement |
| `apps/backend/policies/.../pricing.json` | Preço em créditos (inalterado entre tiers) |
| `apps/backend/src/product` | Preview, catálogo, autorização de geração |
| `apps/web` | **Quality Mode Presentation**, copy de bloqueio |
| `packages/contracts` | `blockedReason` / preview options (se novos literais) |

---

## 3. Fases e issues

### Fase A — Assinatura baseline (issue 35)

- `ensureDefaultFreeSubscription` idempotente
- Hook no JIT (`resolveOrProvisionApplicationUser` ou serviço de domínio)
- `startCycle` quando necessário para wallet
- Testes: usuário novo → entitlement `free` + `active`

### Fase B — Regras comerciais backend (issues 36 ∥ 37)

**36 — Modos por tier**

- `resolveAllowedQualityModes`, `canUseQualityMode`
- `generation-preview` e `public-generation`
- Novos `blockedReason` se necessário

**37 — Catálogo de formatos**

- `buildContentTypeCatalogView`: `available` = assinatura ativa
- Remover dependência de `canRefine` no catálogo
- Atualizar testes de `/me/content-types`

As fases B podem rodar em paralelo após A.

### Fase C — Web (issue 38)

- Desabilitar modos não `allowed` nos radios
- Auto-selecionar modo permitido quando recomendação ou seleção atual é inválida
- Atualizar `getBlockedReason` / i18n
- Remover copy de “formato indisponível no plano” como caso principal

---

## 4. Matriz de bloqueio (referência)

| Estado | Formatos | Modos (free) | Gerar |
|--------|----------|--------------|-------|
| `free` ativo, créditos OK | Todos | Só `fast` | Sim (`fast`) |
| `free` ativo, 0 créditos | Todos | `fast` visível | Não (`insufficient_credits`) |
| `pro` ativo, créditos OK | Todos | Todos | Sim |
| Assinatura inativa | Visíveis* | Conforme tier | Não (`subscription_inactive`) |

\*Visibilidade de formatos com assinatura inativa: implementação pode manter `available: false` com motivo de assinatura — documentar no issue 37.

---

## 5. Riscos e mitigação

| Risco | Mitigação |
|-------|-----------|
| `canRefine` ainda usado para catálogo em outro path | Grep + teste de regressão em preview e content-types |
| Cliente envia `strict` no free | `public-generation` valida tier |
| Usuários legados sem subscription | JIT hook também em “first request” se create já passou |
| `billingPlanId` em config aponta só para `pro` em dev | Manter seed de dev; JIT usa `free` por usuário real |

---

## 6. Verificação manual

1. Login novo → `/me/content-types` → todos formatos disponíveis
2. Plano free → preview só permite Direto; Equilibrado/Afinado desabilitados na UI
3. Upgrade para pro (seed/test) → três modos habilitados
4. Zerar créditos → preview mostra saldo 0; botão gerar desabilitado
5. POST geração com `strict` no free → 403 com motivo claro
