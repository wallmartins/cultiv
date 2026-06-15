# Fase 2 — Authenticated Workspace (Web v2)

**PRD:** [cultiv-authenticated-workspace-web-v2.md](../prd/cultiv-authenticated-workspace-web-v2.md)  
**Parent issue:** [issue-authenticated-workspace-web-v2.md](../prd/issue-authenticated-workspace-web-v2.md)  
**Issues:** [27–34](../issues/README.md#authenticated-workspace--web-v2)  
**Estrutura:** [web-v2-platform-structure.md](./web-v2-platform-structure.md)  
**Specs por tela:** [web-v2-screen-specs.md](./web-v2-screen-specs.md)

**Objetivo:** Entregar o **Authenticated Workspace** (`/app/*`) — geração async-first, voz, histórico, onboarding e settings — reutilizando o **Design System** da fase 1 e consumindo o backend exclusivamente via `client-sdk`.

**Pré-requisitos:**

- Marketing Surface em produção (Vercel)
- `packages/ui` com tokens e primitivos estáveis
- Backend (`apps/backend`) deployado e acessível
- Tenant Auth0 configurado
- `client-sdk` com domínios preview, executions, voice, contentTypes

**Duração estimada:** 6–9 semanas (1–2 devs)

**Pós-v2 imediato:** **Billing Surface** (wallet API, SDK, `/app/billing`, ledger)

---

## 1. Critérios de aceite (Definition of Done)

Alinhado ao PRD. A fase 2 está completa quando:

- [ ] Login/signup via Auth0 Universal Login funciona em pt e en (**App Locale**)
- [ ] Rotas `/app/*` protegidas; redirect para Auth0 se não autenticado
- [ ] Redirect inteligente pós-login: onboarding vs generate
- [ ] `client-sdk` é a única integração com o backend (governance passa)
- [ ] **Generation Screen**: briefing dinâmico, preview debounced, quality modes com labels de produto, imported context colapsado
- [ ] Geração **async-first**: usuário livre após `executions.create`
- [ ] **Active Execution List** + **Execution Watch** + **Active Execution Drawer**
- [ ] **Completion Notification** em sessão ativa
- [ ] **Execution History** listagem + **Execution History Detail**
- [ ] **Voice Dashboard** + exemplos + **Voice Example Composer** (single/batch)
- [ ] **Onboarding** 2 passos (composer + welcome), skippable + reminders
- [ ] **Account Settings**: email, locale, consent placeholder, logout
- [ ] Créditos no header via cache de **Generation Preview** (sem `/app/billing`)
- [ ] App shell: sidebar desktop, bottom nav mobile (3 itens nav)
- [ ] i18n app pt/en completo
- [ ] Effect layers (Runtime Model B) nos serviços SDK
- [ ] Testes com SDK mockado + governance

**Fora do DoD v2:** `/app/billing`, sync como fluxo End User, upload de arquivos.

---

## 2. Arquitetura

### 2.1 Camadas

```
┌─────────────────────────────────────────────────────────────┐
│  React UI (apps/web/routes/app/*)                           │
├─────────────────────────────────────────────────────────────┤
│  TanStack Query — cache, mutations, optimistic updates      │
├─────────────────────────────────────────────────────────────┤
│  lib/services/ (Effect programs)                            │
│    preview · executions · voice · contentTypes · watch      │
├─────────────────────────────────────────────────────────────┤
│  client-sdk (createClientSdk)                               │
│    getToken ← Auth0 getAccessTokenSilently()                │
├─────────────────────────────────────────────────────────────┤
│  apps/backend — Public API Surface                          │
└─────────────────────────────────────────────────────────────┘
```

### 2.2 Effect Runtime Model B

```
apps/web/src/lib/runtime/
├── layers.ts
├── sdk-layer.ts
├── auth-layer.ts
├── services/
│   ├── preview-service.ts
│   ├── execution-service.ts
│   ├── execution-watch-service.ts
│   ├── voice-service.ts
│   └── content-type-service.ts
└── hooks/
    ├── use-runtime.ts
    ├── use-preview-query.ts
    └── use-credit-balance.ts      # preview-derived
```

**Regra:** componentes React → hooks → Effect via Runtime; nunca `fetch` direto ao backend.

### 2.3 Auth0 + TanStack Start

```
__root.tsx
  └── Auth0Provider
        └── /app route
              └── beforeLoad: requireAuth()
```

| Setting | Valor |
|---------|-------|
| Application type | SPA |
| Allowed callbacks | production + localhost `/callback` |
| API audience | `VITE_AUTH0_AUDIENCE` (= backend) |

```typescript
const client = createClientSdk({
  baseUrl: import.meta.env.VITE_API_BASE_URL,
  getToken: () => getAccessTokenSilently({ audience: AUTH0_AUDIENCE }),
})
```

**Application User** provisionado JIT no primeiro request autenticado.

### 2.4 Redirect pós-login

| Condição | Destino |
|----------|---------|
| `!onboardingComplete && voiceExamplesCount === 0` | `/app/onboarding` |
| Caso contrário | `/app/generate` |

v2: `onboardingComplete` em localStorage (`cultiv.onboarding.completed`); migrar para backend quando API existir.

---

## 3. Rotas

### 3.1 Mapa (marketing + app)

```
# Marketing (fase 1 — mantido)
/ , /en , legal , /api/waitlist

# Auth
/callback
/login

# Authenticated Workspace (v2)
/app                       → /app/generate
/app/onboarding
/app/generate              Generation Screen
/app/generate/$executionId  Sync/ops only (não fluxo async padrão)
/app/history
/app/history/$executionId
/app/voice
/app/voice/examples
/app/voice/examples/new
/app/voice/examples/$id/edit
/app/settings              avatar menu only (sem item na nav)
```

**Ausente em v2:** `/app/billing`, `/app/billing/history`

### 3.2 Layouts

| Layout | Rotas |
|--------|-------|
| `MarketingLayout` | `/`, `/en`, legal |
| `AppLayout` | `/app/*` — AppShell, Active Execution List, CreditDisplay |

### 3.3 App Shell Navigation

Três itens primários: **Gerar** · **Histórico** · **Voz**. Settings e logout no avatar.

---

## 4. `packages/ui` — extensões v2

```
packages/ui/src/
├── primitives/
│   Select, Textarea, Badge, Skeleton, Toast, Avatar, Input
├── patterns/
│   Sidebar, AppHeader, BottomNav, DataTable, StatusBadge,
│   CreditDisplay, PreviewPanel, ReminderBanner, ProgressSteps,
│   BriefingGuidancePanel, QualityModeSelector, Drawer
└── layouts/
    AppShell
```

**Domínio rico** (`BriefingForm`, `VoiceExampleComposer`, `ActiveExecutionList`) → `apps/web/components/app/`.

---

## 5. Telas (resumo — detalhe em screen-specs)

| Tela | Rota | SDK principal |
|------|------|---------------|
| Onboarding | `/app/onboarding` | `voice.*`, `preview.get` |
| Generation Screen | `/app/generate` | `contentTypes`, `preview`, `executions.create` |
| Active list + drawer | shell | `executions.watch`, `executions.get` |
| Execution History | `/app/history` | `executions.list` |
| History Detail | `/app/history/$id` | `executions.get` |
| Voice Dashboard | `/app/voice` | `voice.getProfile` |
| Examples | `/app/voice/examples/*` | `voice.list/create/update/batch` |
| Settings | `/app/settings` | Auth0 + locale local |

### 5.1 Onboarding (2 passos)

| # | Conteúdo | Skip |
|---|----------|------|
| 1 | **Voice Example Composer** | ReminderBanner voz em `/app/generate` |
| 2 | **Onboarding Welcome Step** (confidence + créditos) | — |

### 5.2 Generation Screen

- **ContentTypeSelector:** todos os tipos; bloqueados com `reasonCode`
- **BriefingForm:** `inputSchema` dinâmico → briefing `Record`
- **Imported Context Field:** colapsado, paste ≤8k
- **Quality modes:** Direto/Light · Equilibrado/Balanced · Afinado/Polished
- **PreviewPanel:** debounce 500ms
- **Generate:** async create → toast + Active Execution List; **permanece na tela**

### 5.3 Async execution UX

- Lista na sidebar (desktop) / drawer header (mobile)
- `executions.watch` por item in-flight
- Concluído → **Completion Notification** + drawer
- Link "Ver completo" → `/app/history/$id`

### 5.4 Sync route (ops)

`/app/generate/$executionId` — validação operacional; não documentar como fluxo End User.

### 5.5 Settings

Email read-only, **App Locale**, **Voice Training Consent** (revogar quando API), logout.

---

## 6. client-sdk — superfície consumida

| Domínio | Métodos |
|---------|---------|
| `contentTypes` | `list` |
| `preview` | `get` |
| `executions` | `create`, `get`, `list`, `watch` |
| `voice` | `getProfile`, `listExamples`, `createExample`, `updateExample`, `createBatch`, `addBatchItems`, `commitBatch` |

**Não consumido em v2:** billing (ausente no SDK)

**Governança:** `apps/web` declara `@my-ai-orchestrator/client-sdk`; proibido `fetch(`/me/`, axios, rotas backend literais.

---

## 7. TanStack Query

| Query key | Fonte | Stale / invalidação |
|-----------|-------|---------------------|
| `['contentTypes']` | `contentTypes.list` | 5 min |
| `['creditBalance']` | `preview.get` mínimo | invalidate após create + focus |
| `['voice', 'profile']` | `voice.getProfile` | 1 min; após mutations voz |
| `['voice', 'examples', page]` | `voice.listExamples` | 30s |
| `['executions', 'list', filters]` | `executions.list` | 30s |
| `['executions', id]` | `executions.get` | watch-driven |
| `['preview', hash]` | `preview.get` | debounce; não cache longo |

---

## 8. Execution Watch + Completion Notification

```typescript
export const watchExecution = (input: {
  executionId: string
  onTransition: (t: ExecutionTransition) => void
  onObservationFailure?: (f: ObservationFailure) => void
}) =>
  Effect.sync(() =>
    client.executions.watch({
      executionId: input.executionId,
      onTransition: input.onTransition,
      onObservationFailure: input.onObservationFailure,
    })
  )
```

- **Completion Notification:** `completed` + usuário fora do drawer deste id → toast com action Abrir
- **Observation failure:** toast separado (não confundir com falha de geração)
- **Execution Resume:** reattach via lista ativa ou `/app/history/$id`; não forçar `/app/generate/$id` para async

---

## 9. i18n (**App Locale**)

```
apps/web/i18n/locales/
├── pt.ts   # app.shell, app.generate, app.voice, …
└── en.ts
```

Overlays: `field-labels.ts`, `content-types.ts` para labels do catálogo backend.

Rotas `/app/*` **sem** prefixo `/en`. Preferência em Settings + detecção browser.

| CONTEXT | pt-BR | en |
|---------|-------|-----|
| Content Type | Formato | Format |
| Generation Preview | Prévia | Preview |
| Quality mode | Modo | Mode |
| Credit Budget | Créditos | Credits |

---

## 10. Milestones e tarefas

| Milestone | Issue |
|-----------|-------|
| M1 | [27-auth-and-sdk-foundation.md](../issues/27-auth-and-sdk-foundation.md) |
| M2 | [28-app-shell-and-active-execution-shell.md](../issues/28-app-shell-and-active-execution-shell.md) |
| M3 | [29-generation-screen-end-to-end.md](../issues/29-generation-screen-end-to-end.md) |
| M4a | [30-execution-observation-and-drawer.md](../issues/30-execution-observation-and-drawer.md) |
| M4b | [31-execution-history-and-detail.md](../issues/31-execution-history-and-detail.md) |
| M5 | [32-voice-dashboard-and-example-composer.md](../issues/32-voice-dashboard-and-example-composer.md) |
| M6 | [33-onboarding-and-account-settings.md](../issues/33-onboarding-and-account-settings.md) |
| M7 | [34-app-i18n-governance-and-qa-gate.md](../issues/34-app-i18n-governance-and-qa-gate.md) |

### M1 — Auth + SDK (1 semana)

| # | Tarefa |
|---|--------|
| M1-01 | Auth0 tenant (SPA, audience) |
| M1-02 | Auth0Provider + callback `/callback` |
| M1-03 | Route guard `/app/*` |
| M1-04 | `auth-layer.ts`, `sdk-layer.ts` |
| M1-05 | `client-sdk` em `apps/web` |
| M1-06 | Smoke test autenticado |
| M1-07 | Redirect inteligente pós-login |

### M2 — App shell (1 semana)

| # | Tarefa |
|---|--------|
| M2-01 | `AppShell` (sidebar + header + bottom nav) |
| M2-02 | `AppLayout` route |
| M2-03 | Nav 3 itens + avatar menu → settings |
| M2-04 | `CreditDisplay` (preview cache) |
| M2-05 | `ActiveExecutionList` shell (desktop + mobile badge) |
| M2-06 | Redirect `/app` → `/app/generate` |

### M3 — Generation (2 semanas)

| # | Tarefa |
|---|--------|
| M3-01 | `ContentTypeSelector` |
| M3-02 | `BriefingForm` dinâmico + guidance panel |
| M3-03 | `ImportedContextField` colapsado |
| M3-04 | `QualityModeSelector` + labels produto |
| M3-05 | `PreviewPanel` debounced |
| M3-06 | `executions.create` mutation async |
| M3-07 | Field-label i18n overlays |

### M4 — Execution UX (1–1,5 semana)

| # | Tarefa |
|---|--------|
| M4-01 | `execution-watch-service` + list store |
| M4-02 | `ProgressSteps` em lista/drawer |
| M4-03 | `ActiveExecutionDrawer` |
| M4-04 | `CompletionNotificationHost` |
| M4-05 | `ExecutionHistoryTable` + filtros client-side |
| M4-06 | `ExecutionHistoryDetail` + regenerate |
| M4-07 | Rota sync ops `/app/generate/$id` (mínima) |

### M5 — Voice (1,5 semana)

| # | Tarefa |
|---|--------|
| M5-01 | `VoiceDashboard` |
| M5-02 | Examples list + paginação |
| M5-03 | `VoiceExampleComposer` (shared) |
| M5-04 | Single vs batch submit routing |
| M5-05 | Consent modal |
| M5-06 | `ReminderBanner` integration |

### M6 — Onboarding + Settings (3–5 dias)

| # | Tarefa |
|---|--------|
| M6-01 | `OnboardingFlow` 2 passos |
| M6-02 | `OnboardingWelcomeStep` |
| M6-03 | Skip flags + reminders |
| M6-04 | `/app/settings` (locale, email, consent UI) |

### M7 — i18n, polish, testes (1 semana)

| # | Tarefa |
|---|--------|
| M7-01 | Strings app pt/en completas |
| M7-02 | `i18n/errors.ts` por `ApiErrorCode` |
| M7-03 | Testes serviços + composer routing |
| M7-04 | E2E crítico: login → generate → notification → drawer |
| M7-05 | Governance pass |
| M7-06 | Responsive QA |

---

## 11. Testes

| Tipo | Escopo |
|------|--------|
| Unit | Preview debounce, error mapper, composer routing, onboarding redirect |
| Integration | SDK mock (`HttpTransport` fake) |
| Component | PreviewPanel estados, watch unmount `stop()` |
| E2E | Auth0 dev tenant ou mock token |
| Governance | `frontend-client-boundary.test.ts` |

---

## 12. Variáveis de ambiente

| Variável | Descrição |
|----------|-----------|
| `VITE_AUTH0_DOMAIN` | Auth0 domain |
| `VITE_AUTH0_CLIENT_ID` | SPA client ID |
| `VITE_AUTH0_AUDIENCE` | API audience |
| `VITE_API_BASE_URL` | Backend public URL |

---

## 13. Lacunas backend/SDK (pré ou pós-v2)

| Item | Impacto | Workaround v2 |
|------|---------|---------------|
| `GET /me/billing/wallet` | Sem billing page | Preview cache no header |
| Onboarding flag backend | Redirect | localStorage |
| Consent revoke API pública | Settings revoke disabled | Copy + placeholder |
| `executions.list` filters | Filtros | Client-side na v2 |

---

## 14. Riscos

| Risco | Mitigação |
|-------|-----------|
| Auth0 audience mismatch | Validar JWT em staging |
| SDK contract drift | `ClientSdkContractFailure` UI |
| Async UX confusa | Lista ativa + notification + drawer |
| Preview como fonte de saldo | Migrar para billing pós-v2 |
| Field labels em inglês no API | Overlay i18n no web |

---

## 15. Fora do escopo v2

- **Billing Surface** completa
- Marketing Surface redesign
- File upload **Imported Context**
- Push notifications
- Mobile app
- Dark mode app (opcional, não bloqueia)
- **Operational API Surface** no web

**Fase 2.1 (pós-v2):** Billing Surface PRD + wallet SDK + `/app/billing` + migração `CreditDisplay`.
