# Cultiv Web v2 — Estrutura da Plataforma (Authenticated Workspace)

Planejamento consolidado da sessão grill-with-docs (2026-06). Termos de domínio em [`CONTEXT.md`](../../../CONTEXT.md). **PRD:** [`cultiv-authenticated-workspace-web-v2.md`](../prd/cultiv-authenticated-workspace-web-v2.md). **Plano:** [`phase-2-implementation-plan.md`](./phase-2-implementation-plan.md).

## Escopo

| Incluído (v2) | Fora (v2) |
|---------------|-----------|
| **Authenticated Workspace** (`/app/*`) | Evolução da **Marketing Surface** |
| Auth0 + `client-sdk` | **Billing Surface** (wallet, histórico, compra) |
| Geração async-first + lista ativa | Upload de arquivos em **Imported Context** |
| Voz, histórico, settings | **Operational API Surface** / Sync Run para End User |
| i18n pt-BR + en (**App Locale**) | |

**Pós-v2 imediato:** Billing Surface completo (opção C).

---

## Decisões de produto (resumo)

| Tópico | Decisão |
|--------|---------|
| Escopo | Só workspace autenticado |
| Primeiro login | Redirect inteligente: sem exemplos + onboarding incompleto → `/app/onboarding`; senão → `/app/generate` |
| Geração | **Async Run** padrão; usuário livre após disparar |
| Resultado async | **Active Execution List** (sidebar) + **Completion Notification** + **Active Execution Drawer** |
| Sync | `/app/generate/$executionId` — ops/debug, não fluxo End User |
| Histórico | Lista + **Execution History Detail** (`/app/history/$id`) |
| Nav | Gerar · Histórico · Voz + Settings no avatar |
| Billing v2 | Créditos no header via cache de **Generation Preview** |
| Onboarding | 2 passos: **Voice Example Composer** → **Onboarding Welcome Step** |
| Voz | **Voice Example Composer** compartilhado (1 slot → create; 2+ → batch) |
| Briefing | **Briefing Form** dinâmico por **Content Type** |
| Imported Context | Campo colapsado, paste only (máx. 8k chars) |
| Quality modes | 3 visíveis; labels: pt `Direto/Equilibrado/Afinado`, en `Light/Balanced/Polished` |
| Content types | Todos no seletor; indisponíveis desabilitados com motivo |
| Settings | Email, locale, **Voice Training Consent**, logout |
| i18n app | Bilíngue dia 1; rotas `/app/*` sem prefixo `/en` |

---

## Mapa de rotas

```
# Auth
/callback                  Auth0 handler
/login                     Shortcut → Universal Login

# App shell (/app/*)
/app                       → redirect /app/generate
/app/onboarding            Onboarding (2 passos)
/app/generate              Generation Screen
/app/generate/$executionId Sync/ops result (não fluxo padrão async)
/app/history               Execution History
/app/history/$executionId  Execution History Detail
/app/voice                 Voice Dashboard
/app/voice/examples        Lista de exemplos
/app/voice/examples/new    Voice Example Composer (criar)
/app/voice/examples/$id/edit Voice Example Composer (editar, 1 slot)
/app/settings              Account Settings Screen (avatar menu)
```

Marketing (`/`, `/en`, legal, waitlist) permanece estável.

---

## Telas e comportamento

### Onboarding (`/app/onboarding`)

| Passo | Conteúdo | SDK |
|-------|----------|-----|
| 1/2 | **Voice Example Composer** (mesmo componente de `/app/voice/examples/new`) | `voice.createExample` ou batch |
| 2/2 | **Onboarding Welcome Step**: Voice Confidence, créditos (preview), CTA → `/app/generate` | `voice.getProfile`, `preview.get` |

Skippable por passo → **ReminderBanner** na Generation Screen.

### Generation Screen (`/app/generate`)

| Bloco | Detalhe |
|-------|---------|
| ContentTypeSelector | `contentTypes.list()` — todos os tipos, bloqueados com `blockedReason` |
| BriefingForm | Campos de `inputSchema` do tipo selecionado |
| BriefingGuidancePanel | `briefingGuidance` do catálogo |
| Imported Context Field | Colapsado; textarea paste; `importedContext` |
| QualityModeSelector | Labels produto; valores `fast/balanced/strict` |
| PreviewPanel | Debounce 500ms → `preview.get` |
| GenerateButton | `executions.create` → item na **Active Execution List**; usuário permanece na tela |

### Active Execution List + Drawer

| Contexto | Comportamento |
|----------|---------------|
| Desktop | Lista fixa na sidebar, abaixo da nav |
| Mobile | Ícone no header com badge → drawer com lista |
| Item em progresso | Status via `executions.watch` |
| Item concluído | **Completion Notification** + clique → **Active Execution Drawer** |
| Drawer | Texto, copiar, regenerar, link "Ver completo" → `/app/history/$id` |

### Execution History

| Rota | Comportamento |
|------|---------------|
| `/app/history` | Tabela paginada `executions.list`, filtros (período, status, tipo) |
| `/app/history/$id` | **Execution History Detail** — view completa, regenerar com briefing pré-preenchido |

### Voice

| Rota | Comportamento |
|------|---------------|
| `/app/voice` | **Voice Dashboard**: confidence, diagnósticos, cobertura por formato, CTAs |
| `/app/voice/examples` | Lista `voice.listExamples` |
| `/app/voice/examples/new` | **Voice Example Composer** |
| `/app/voice/examples/$id/edit` | Composer 1 slot + `voice.updateExample` |

**Voice Training Consent:** modal gate antes do primeiro save.

### Settings (`/app/settings`)

- Email read-only (Auth0)
- **App Locale** (pt-BR / en)
- **Voice Training Consent** status + revogar (quando API pública existir)
- Logout

---

## Componentes

### `packages/ui` (design system + app shell)

```
primitives/     Select, Textarea, Badge, Skeleton, Toast, Avatar, Input
patterns/       Sidebar, AppHeader, BottomNav, DataTable, StatusBadge,
                CreditDisplay, PreviewPanel, ReminderBanner, ProgressSteps,
                BriefingGuidancePanel, QualityModeSelector, Drawer
layouts/        AppShell
```

### `apps/web/components/app/` (domínio + SDK)

```
VoiceExampleComposer
BriefingForm              ← renderiza inputSchema dinâmico
ContentTypeSelector
GenerationScreen
ActiveExecutionList
ActiveExecutionDrawer
ExecutionResultView
ExecutionHistoryTable
ExecutionHistoryDetail
VoiceDashboard
OnboardingFlow
OnboardingWelcomeStep
ImportedContextField
CompletionNotificationHost
CreditBalanceHook         ← preview-derived balance
```

### Serviços (`apps/web/src/lib/`)

```
auth-layer.ts             Auth0 getToken
sdk-layer.ts              createClientSdk
execution-watch-service.ts executions.watch + handles
preview-service.ts        debounced preview.get
```

---

## SDK / API consumida (v2)

| Domínio | Métodos | Rotas backend |
|---------|---------|---------------|
| `contentTypes` | `list` | `GET /me/content-types` |
| `preview` | `get` | `POST /api/generation-preview` |
| `executions` | `create`, `get`, `list`, `watch` | `POST /me/executions/run`, `GET /me/executions`, `GET /me/executions/:id`, SSE events |
| `voice` | `getProfile`, `listExamples`, `createExample`, `updateExample`, `createBatch`, `addBatchItems`, `commitBatch` | `/me/voice-profile/*` |

**Governança:** zero `fetch` direto ao backend; só `@my-ai-orchestrator/client-sdk`.

### Lacunas pós-v2 (backend + SDK)

| Capacidade | Uso |
|------------|-----|
| `GET /me/billing/wallet` + `client.billing` | Billing Surface, header independente do preview |
| Revogação **Voice Training Consent** | Settings → privacidade de voz |
| **Onboarding Completion** persistido | Redirect inteligente first-login |

---

## TanStack Query (cache)

| Query key | Fonte | Invalidação |
|-----------|-------|-------------|
| `['contentTypes']` | `contentTypes.list` | 5 min stale |
| `['creditBalance']` | `preview.get` mínimo | Após `executions.create`, app focus |
| `['voice', 'profile']` | `voice.getProfile` | Após mutations de exemplos |
| `['voice', 'examples', page]` | `voice.listExamples` | Após create/update/batch |
| `['executions', 'list', filters]` | `executions.list` | 30s |
| `['executions', id]` | `executions.get` | Watch transitions |
| `['preview', hash]` | `preview.get` | Debounce, não cache longo |

---

## App shell layout

```
Desktop
┌────────────────────────────────────────────────────────┐
│ AppHeader: Logo | CreditDisplay | ActiveExec icon | Avatar▼│
├──────────────┬─────────────────────────────────────────┤
│ Nav (3)      │ Main content                             │
│ Gerar        │                                          │
│ Histórico    │                                          │
│ Voz          │                                          │
│ ───────────  │                                          │
│ Active List  │                                          │
└──────────────┴─────────────────────────────────────────┘

Mobile: bottom nav (3) + header (créditos, gerações●, avatar)
```

---

## Milestones sugeridos (ajuste do phase-2)

1. **M1 Auth + SDK** — Auth0, route guard, sdk-layer
2. **M2 App shell** — AppShell, nav, Active Execution List shell, CreditDisplay
3. **M3 Generation** — BriefingForm dinâmico, preview, quality modes, async create
4. **M4 Execution UX** — watch, drawer, notifications, history + detail
5. **M5 Voice** — Composer, dashboard, examples CRUD/batch
6. **M6 Onboarding + Settings** — 2 passos, locale, consent placeholder
7. **M7 i18n + QA** — strings app pt/en, testes, governance

---

## Próximo passo

Detalhar wireframe/spec **por tela** (campos, estados vazios, erros SDK) antes de abrir issues de implementação.
