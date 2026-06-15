# Cultiv Web v2 — Especificação por Tela

Detalhamento pré-implementação do **Authenticated Workspace**. **PRD:** [`cultiv-authenticated-workspace-web-v2.md`](../prd/cultiv-authenticated-workspace-web-v2.md). Estrutura geral em [`web-v2-platform-structure.md`](./web-v2-platform-structure.md).

**Convenções**

- **App Locale:** `pt-BR` | `en` — preferência em Settings; fallback browser.
- **SDK:** `@my-ai-orchestrator/client-sdk` apenas.
- Labels de `inputSchema` vindos do backend estão em inglês; a UI aplica overlay i18n por `(contentTypeId, fieldKey)` em `apps/web/i18n/field-labels.ts`.
- Content type `label` do catálogo: overlay i18n por `contentTypeId` em `apps/web/i18n/content-types.ts`.

---

## Índice

1. [App Shell (compartilhado)](#1-app-shell-compartilhado)
2. [Auth](#2-auth)
3. [Onboarding](#3-onboarding)
4. [Generation Screen](#4-generation-screen)
5. [Active Execution List + Drawer](#5-active-execution-list--drawer)
6. [Completion Notification](#6-completion-notification)
7. [Execution History](#7-execution-history)
8. [Execution History Detail](#8-execution-history-detail)
9. [Voice Dashboard](#9-voice-dashboard)
10. [Voice Examples List](#10-voice-examples-list)
11. [Voice Example Composer](#11-voice-example-composer)
12. [Voice Training Consent Modal](#12-voice-training-consent-modal)
13. [Account Settings](#13-account-settings)
14. [Erros SDK (global)](#14-erros-sdk-global)
15. [Namespaces i18n](#15-namespaces-i18n)

---

## 1. App Shell (compartilhado)

**Rotas:** layout pai de `/app/*`  
**Componentes:** `AppShell`, `AppHeader`, `Sidebar`, `BottomNav`, `CreditDisplay`, `ActiveExecutionList`

### Wireframe (desktop)

```
┌─────────────────────────────────────────────────────────────────┐
│ [Cultiv]              ◎ 120 créditos    [⧗ 2]    [Avatar ▼]    │
├──────────────┬──────────────────────────────────────────────────┤
│ ● Gerar      │                                                  │
│   Histórico  │              {children}                        │
│   Voz        │                                                  │
│ ──────────── │                                                  │
│ Em andamento │                                                  │
│ ○ Blog  45%  │                                                  │
│ ✓ Thread     │                                                  │
└──────────────┴──────────────────────────────────────────────────┘
```

### Blocos

| Bloco | Dados | Comportamento |
|-------|-------|---------------|
| Logo | — | Link → `/app/generate` |
| CreditDisplay | `preview.get` mínimo → `currentBalance` | Query `['creditBalance']`; skeleton `◎ —`; 0 créditos → variant danger |
| Active exec icon (mobile) | contagem local in-flight | Badge numérico; abre drawer com lista |
| Avatar menu | Auth0 user | Items: Configurações, Sair |
| Sidebar nav | rota ativa | 3 itens; highlight na rota atual |
| Active Execution List | store local + `executions.list`/`watch` | Ver §5 |

### Estados

| Estado | UI |
|--------|-----|
| Loading auth | Full-page skeleton no primeiro paint |
| SDK indisponível | Banner danger no topo + retry |
| Créditos loading | `◎ …` no header |

### i18n (`app.shell`)

| Key | pt-BR | en |
|-----|-------|-----|
| `nav.generate` | Gerar | Generate |
| `nav.history` | Histórico | History |
| `nav.voice` | Voz | Voice |
| `nav.settings` | Configurações | Settings |
| `nav.logout` | Sair | Sign out |
| `credits.label` | créditos | credits |
| `activeExecutions.title` | Em andamento | In progress |
| `activeExecutions.empty` | Nenhuma geração ativa | No active generations |

---

## 2. Auth

**Rotas:** `/callback`, `/login`  
**Fora do App Shell**

### Fluxo

```
/login → Auth0 Universal Login → /callback → sessão → redirect inteligente
```

### Redirect pós-auth

| Condição | Destino |
|----------|---------|
| `!onboardingComplete && examplesCount === 0` | `/app/onboarding` |
| Caso contrário | `/app/generate` |

`onboardingComplete`: localStorage v2 (`cultiv.onboarding.completed`); substituir por backend quando existir.

### Estados de erro

| Erro | UI |
|------|-----|
| Callback inválido | Página erro: "Não foi possível entrar" + [Tentar novamente] |
| Token expirado em `/app/*` | Redirect silencioso → `/login` |

### i18n (`app.auth`)

| Key | pt-BR | en |
|-----|-------|-----|
| `login.title` | Entrar no Cultiv | Sign in to Cultiv |
| `error.callback` | Não foi possível concluir o login. | We couldn't complete sign-in. |
| `action.retry` | Tentar novamente | Try again |

---

## 3. Onboarding

**Rota:** `/app/onboarding`  
**SDK:** `voice.*`, `voice.getProfile`, `preview.get`

### Passo 1/2 — Voice Example Composer

Wrapper com `OnboardingProgress` (2 steps).

```
┌────────────────────────────────────────────────────────┐
│  [1 Ensine sua voz] ——— [2 Pronto]                     │
│                                                        │
│  Adicione exemplos do seu texto                        │
│  Cole textos seus para a IA aprender como você escreve.│
│                                                        │
│  {VoiceExampleComposer — ver §11}                      │
│                                                        │
│  [Pular]                              [Continuar →]    │
└────────────────────────────────────────────────────────┘
```

| Ação | Comportamento |
|------|---------------|
| Pular | Avança para passo 2 sem salvar; flag `onboarding.voiceSkipped` |
| Continuar | Se slots vazios → avança; se preenchidos → salvar (consent + create/batch) → passo 2 |
| Salvar com sucesso | Invalida `voice.profile`, `voice.examples` |

### Passo 2/2 — Onboarding Welcome Step

```
┌────────────────────────────────────────────────────────┐
│  [1 Ensine sua voz] ——— [2 Pronto]                     │
│                                                        │
│  Você está pronto para gerar                           │
│                                                        │
│  ┌─ Sua voz ──────────────────────────────────────┐   │
│  │ Confiança: Alta / Média / Baixa / —              │   │
│  │ {diagnostics.summary ou nextAction copy}        │   │
│  └────────────────────────────────────────────────┘   │
│                                                        │
│  ┌─ Créditos ─────────────────────────────────────┐   │
│  │ Disponíveis: {currentBalance}                   │   │
│  └────────────────────────────────────────────────┘   │
│                                                        │
│  [Pular]                         [Ir para Geração →]   │
└────────────────────────────────────────────────────────┘
```

| Dado | Fonte |
|------|-------|
| Voice Confidence | `voice.getProfile().profile.confidence` |
| Summary | `diagnostics.summary` ou mapeamento de `reasonCodes` |
| Créditos | `preview.get` mínimo |

| Ação | Comportamento |
|------|---------------|
| Ir para Geração | Set `onboardingComplete`; navigate `/app/generate` |
| Pular | Idem, sem bloqueio |

### Estados

| Estado | UI |
|--------|-----|
| Profile loading | Skeleton cards |
| Zero exemplos | Confidence `none`; copy encorajando exemplos depois |
| Profile rebuild `in_progress` | Badge "Atualizando sua voz…" |

### ReminderBanner (pós-skip)

| Skip | Banner em `/app/generate` |
|------|---------------------------|
| Passo 1 voz | "Adicione exemplos de voz para textos mais precisos" → `/app/voice/examples/new` |

> v2: apenas reminder de voz (sem passo de preferências).

### i18n (`app.onboarding`)

| Key | pt-BR | en |
|-----|-------|-----|
| `step1.title` | Ensine sua voz | Teach your voice |
| `step1.subtitle` | Cole textos seus para a IA aprender como você escreve. | Paste your writing so the AI learns how you write. |
| `step2.title` | Você está pronto para gerar | You're ready to generate |
| `skip` | Pular | Skip |
| `continue` | Continuar | Continue |
| `goGenerate` | Ir para Geração | Go to Generate |

---

## 4. Generation Screen

**Rota:** `/app/generate`  
**SDK:** `contentTypes.list`, `preview.get`, `executions.create`

### Wireframe

```
┌──────────────────────────────────────────────────────────────┐
│ {ReminderBanner — opcional}                                  │
│                                                              │
│ Formato                                                      │
│ [ LinkedIn post ▼ ]  (itens bloqueados: disabled + tooltip) │
│                                                              │
│ Briefing                                                     │
│ {BriefingForm — campos dinâmicos inputSchema}                │
│ [+ Adicionar material de referência]  ← colapsado            │
│                                                              │
│ Idioma do texto                                              │
│ [ PT-BR ▼ ]                                                  │
│                                                              │
│ Modo                                                         │
│ ( ) Direto  (●) Equilibrado ★  ( ) Afinado                   │
│ Todos os modos preservam sua voz…                            │
│                                                              │
│ ┌─ Prévia ──────────────────────────────────────────────┐   │
│ │ Preço: 5 créditos · Saldo: 120 → 115                   │   │
│ │ {recommendation.explanation se houver}                 │   │
│ └──────────────────────────────────────────────────────┘   │
│                                                              │
│ [ Gerar texto (5 créditos) ]                                 │
└──────────────────────────────────────────────────────────────┘
```

### Content types (catálogo v2)

| id | Label UI pt | Label UI en |
|----|-------------|-------------|
| `linkedin-post` | Post LinkedIn | LinkedIn post |
| `twitter-thread` | Thread | Thread |
| `long-form-blog` | Blog longo | Long-form blog |
| `newsletter` | Newsletter | Newsletter |
| `validation-post` | Post de validação | Validation post |
| `architecture-post` | Post de arquitetura | Architecture post |

Indisponível por assinatura inativa: `disabled` + `reasonCode` → `subscription_inactive`. Formatos **não** são bloqueados por tier de plano (ADR 0002).

Modos de qualidade indisponíveis por tier: radio `disabled` + `blockedReason` da preview (`quality_mode_plan_restriction`, `insufficient_credits`).

### BriefingForm — campos por content type

Renderizar `inputSchema[]` do item selecionado:

| `type` | Componente UI |
|--------|---------------|
| `string` | `Input` single line |
| `text` | `Textarea` |
| `number` | `Input type=number` |
| `boolean` | Checkbox |
| `enum` | `Select` com `options` |
| `array` | Lista editável (add/remove rows) de strings |

**Validação cliente:** todos `required: true` preenchidos antes de habilitar preview/generate.

**Payload:** `briefing` = `Record<fieldKey, value>` (não string única).

### Imported Context Field

| Prop | Valor |
|------|-------|
| Collapsed default | Sim |
| Max length | 8000 chars (contador) |
| Payload | `importedContext?: string` |

Copy colapsado: "Adicionar material de referência" / "Add reference material"  
Aviso expandido: "Cole texto externo. Arquivos ainda não são suportados. O conteúdo passa por verificação de segurança."

### Quality Mode Presentation

| API | Label pt | Label en |
|-----|----------|----------|
| `fast` | Direto | Light |
| `balanced` | Equilibrado | Balanced |
| `strict` | Afinado | Polished |

Badge ★ quando `qualityModes[].recommended === true`.

### PreviewPanel

| Trigger | Debounce 500ms após mudança em: contentType, briefing, language, qualityMode, importedContext |
|---------|-----------------------------------------------------------------------------------------------|
| Loading | Skeleton 1–2 linhas + "Calculando prévia…" |
| Success | preço, saldo atual → projetado, recomendação |
| Erro | Mensagem tipada; botão gerar desabilitado |

Guardar `pricingSnapshot.quoteId` para `executions.create`.

### GenerateButton — estados

| Estado | Label pt | Habilitado |
|--------|----------|------------|
| Briefing incompleto | Preencha o briefing | Não |
| Preview loading | Calculando… | Não |
| Preview ok | Gerar texto ({N} créditos) | Sim |
| Sem créditos | Sem créditos disponíveis | Não |
| Creating | Enviando… | Não |
| Preview erro safety block | Material bloqueado pela política | Não |

**Pós-create (async):** toast success "Geração iniciada"; adiciona à Active Execution List; **permanece** em `/app/generate`.

### executions.create payload

```typescript
{
  contentType: string,
  briefing: Record<string, unknown>,
  language?: string,
  qualityMode: 'fast' | 'balanced' | 'strict',
  quoteId: string,  // do preview
  previewRecommendation?: { qualityMode, reasonCodes, explanation },
  importedContext?: string
}
```

### i18n (`app.generate`)

Ver também `app.qualityModes.*`, `app.contentTypes.*`, `app.fields.{contentTypeId}.{key}`.

---

## 5. Active Execution List + Drawer

**Componentes:** `ActiveExecutionList`, `ActiveExecutionDrawer`  
**SDK:** `executions.watch`, `executions.get`

### Lista (sidebar / mobile drawer)

| Coluna item | Fonte |
|-------------|-------|
| Título | content type label |
| Status | `queued` → Na fila · `running` → Gerando {percent}% · `done` → Pronto · `failed` → Falhou |
| Tempo | `createdAt` relativo |

Manter no máximo **20 itens** recentes em memória (in-flight + concluídos últimas 24h não abertos).

### Watch

- Um `executions.watch` por item in-flight.
- `stop()` no unmount ou quando terminal.
- Atualiza percent via `progress.percent`.

### Drawer (item `done`)

```
┌─ Drawer ──────────────────────┐
│ Post LinkedIn · Pronto    [×] │
│ ───────────────────────────── │
│ {result.content — markdown?   │
│  plain pre-wrap}              │
│ ───────────────────────────── │
│ [Copiar] [Regenerar]          │
│ Ver completo no histórico →   │
└───────────────────────────────┘
```

| Ação | Destino |
|------|---------|
| Copiar | clipboard + toast |
| Regenerar | `/app/generate` com briefing restaurado (se disponível em metadata; senão só content type) |
| Ver completo | `/app/history/$jobId` |

### Drawer (item `running`)

- `ProgressSteps` com `progress.currentStep` / `totalSteps`
- Sem texto ainda; botão copiar desabilitado

### Drawer (item `failed`)

- `error.message`
- [Tentar de novo] → `/app/generate` pré-preenchido
- 0 créditos cobrados (copy informativa se `failed` early)

### Observation failure

Toast danger: "Perdemos conexão com esta geração" + [Atualizar] → `executions.get`.

---

## 6. Completion Notification

**Componente:** `CompletionNotificationHost` (toasts)

| Condição | Toast |
|----------|-------|
| `watch` → `completed` e usuário **não** está no drawer deste id | "Seu texto está pronto" + action Abrir |
| Usuário em outra rota | Idem |

Duração 6s; action abre drawer.

**i18n:** `app.notifications.ready.title`, `.action`

---

## 7. Execution History

**Rota:** `/app/history`  
**SDK:** `executions.list`

### Wireframe

```
┌──────────────────────────────────────────────────────────┐
│ Histórico                              [Filtros ▼]       │
├──────────┬──────────┬─────────┬────────┬───────────────┤
│ Formato  │ Data     │ Modo    │ Créd.  │ Status        │
├──────────┼──────────┼─────────┼────────┼───────────────┤
│ LinkedIn │ 12 jun   │ Equil.  │ 5      │ ✓ Concluído   │
│ Thread   │ 11 jun   │ Direto  │ 3      │ ✗ Falhou      │
└──────────┴──────────┴─────────┴────────┴───────────────┘
        [ Carregar mais ]
```

### Filtros (query params)

| Filtro | Valores |
|--------|---------|
| Período | 7d, 30d, 90d, all (default 30d) |
| Status | all, done, failed, running, queued |
| Content type | all + ids do catálogo |

> Backend `executions.list` hoje expõe `limit`/`offset`; filtros podem ser client-side na v2 até API suportar query filters.

### Colunas

| Coluna | Fonte |
|--------|-------|
| Modo | map `qualityMode` do metadata/telemetry se disponível; senão "—" |
| Créditos | `result.metadata` ou telemetry se exposto no status |

### Estados

| Estado | UI |
|--------|-----|
| Loading | Skeleton table |
| Empty | Ilustração + "Nenhuma geração ainda" + CTA Gerar |
| Error | Banner + retry |

Click row → `/app/history/$jobId`

---

## 8. Execution History Detail

**Rota:** `/app/history/$executionId`  
**SDK:** `executions.get`

### Wireframe

```
┌──────────────────────────────────────────────────────────┐
│ ← Voltar ao histórico                                    │
│                                                          │
│ ┌─ Status ─────────────────────────────────────────────┐  │
│ │ ✓ Concluído · LinkedIn post · Equilibrado · 5 créd. │  │
│ │ Confiança de voz: Alta                                │  │
│ └─────────────────────────────────────────────────────┘  │
│                                                          │
│ ┌─ Texto gerado ─────────────────────────────────────┐  │
│ │ {result.content}                                    │  │
│ └─────────────────────────────────────────────────────┘  │
│                                                          │
│ [Copiar]  [Regenerar]  [Detalhes ▼]                      │
│                                                          │
│ ┌─ Detalhes (expandido) ─────────────────────────────┐  │
│ │ executionId, createdAt, completedAt                 │  │
│ │ voice.voiceProfileConfidence, adaptationMode        │  │
│ │ progress steps (se async)                           │  │
│ └─────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────┘
```

### Estados por `status`

| status | UI principal |
|--------|--------------|
| `queued` / `running` | Progress + auto-watch; polling fallback |
| `done` | Texto + metadata |
| `failed` | `error.message` + Tentar de novo |

### Regenerar

Navigate `/app/generate` com state: `{ contentType, briefing, language, qualityMode }` recuperados do execution snapshot quando possível.

---

## 9. Voice Dashboard

**Rota:** `/app/voice`  
**SDK:** `voice.getProfile`

### Wireframe

```
┌──────────────────────────────────────────────────────────┐
│ Sua voz                                                  │
│                                                          │
│ ┌─ Confiança ─────────────────────────────────────────┐  │
│ │ ●●● Alta                                             │  │
│ │ {profile.description}                                │  │
│ │ Modo de adaptação: Padrão / Conservador              │  │
│ └─────────────────────────────────────────────────────┘  │
│                                                          │
│ ┌─ Diagnóstico ──────────────────────────────────────┐  │
│ │ {diagnostics.summary}                              │  │
│ │ Próximo passo: {nextActionCodes[0] → copy}         │  │
│ └─────────────────────────────────────────────────────┘  │
│                                                          │
│ Cobertura por formato                                    │
│ ✓ LinkedIn — alta    ○ Blog — baixa                      │
│                                                          │
│ [Gerenciar exemplos]     [+ Adicionar exemplo]           │
└──────────────────────────────────────────────────────────┘
```

### Mapeamento confidence

| API | Label pt |
|-----|----------|
| `high` | Alta |
| `medium` | Média |
| `low` | Baixa |

### Cobertura

Listar `bestCoveredContentTypes` (badge success) + `underrepresentedContentTypes` (badge warning) com labels localizados.

### nextActionCodes → CTA

| Code | CTA |
|------|-----|
| `add_more_examples` | Adicionar exemplo |
| `add_examples_from_other_content_types` | Adicionar outro formato |
| `upgrade_plan` | Desabilitado v2 (sem billing) — copy "Em breve" |

### Estados

| Estado | UI |
|--------|-----|
| `diagnostics.updating` | Banner "Recalculando sua voz…" |
| `pendingRebuild.status === 'failed'` | Alert danger + retry copy |
| Zero exemplos | Empty state encorajando primeiro exemplo |

---

## 10. Voice Examples List

**Rota:** `/app/voice/examples`  
**SDK:** `voice.listExamples`

### Wireframe

```
┌──────────────────────────────────────────────────────────┐
│ Exemplos de voz                         [+ Novo exemplo]   │
├──────────────────────────────────────────────────────────┤
│ ┌────────────────────────────────────────────────────┐  │
│ │ LinkedIn · PT-BR · Fixado                          │  │
│ │ "Primeiras linhas do previewText…"                 │  │
│ │                                    [Editar]        │  │
│ └────────────────────────────────────────────────────┘  │
│ … paginação                                              │
└──────────────────────────────────────────────────────────┘
```

### Card

| Campo | Fonte |
|-------|-------|
| Badge formato | `explicitContentType` ou hint |
| Idioma | `language` |
| Preview | `previewText` |
| Pin | `pinned` → ícone |

### Estados

| Estado | UI |
|--------|-----|
| Empty | "Nenhum exemplo ainda" + CTA composer |
| Loading | Skeleton cards |

---

## 11. Voice Example Composer

**Rotas:** onboarding passo 1, `/app/voice/examples/new`, `/app/voice/examples/$id/edit`  
**SDK:** `createExample` | batch | `updateExample`

### Slot (repetível)

```
┌─ Exemplo {n} ─────────────────────────────────────── [Remover] ┐
│ Texto *                                                          │
│ [ Textarea — min 50 chars recomendado ]                          │
│                                                                  │
│ Formato *        [ LinkedIn post ▼ ]                             │
│ Idioma *         [ PT-BR ▼ ]                                     │
│                                                                  │
│ ▼ Opções avançadas                                               │
│   Contexto (opcional)                                            │
│   Anti-padrões (tags)                                            │
│   Fixar este exemplo ☐                                           │
└──────────────────────────────────────────────────────────────────┘

[+ Adicionar outro exemplo]        (oculto em modo edit)

[ Salvar exemplos ]
```

### Modos

| Modo | Slots | Submit |
|------|-------|--------|
| Create | 1..N | 1 → `createExample`; 2+ → batch flow |
| Edit | 1 fixo | `updateExample` |
| Onboarding | 1..N | Igual create |

### Validação

| Regra | Mensagem |
|-------|----------|
| `text` vazio | Obrigatório |
| `text` < 20 chars | Muito curto para aprender sua voz |
| Formato obrigatório | Selecione um formato |

### Batch partial failure

Exibir `itemResults` rejeitados inline por slot com `message`; aceitos permanecem.

### i18n (`app.voice.composer`)

| Key | pt-BR | en |
|-----|-------|-----|
| `addSlot` | Adicionar outro exemplo | Add another example |
| `save` | Salvar exemplos | Save examples |
| `advanced` | Opções avançadas | Advanced options |

---

## 12. Voice Training Consent Modal

**Trigger:** primeiro save de exemplo (onboarding ou voz)  
**Backend:** consent assert no POST (erro se ausente)

### Wireframe

```
┌─────────────────────────────────────────┐
│  Uso dos seus exemplos de voz           │
│                                         │
│  Para aprender sua escrita, o Cultiv     │
│  armazena e processa os textos que       │
│  você enviar. Você pode revogar isso    │
│  depois em Configurações.               │
│                                         │
│  [ Cancelar ]  [ Concordo e continuar ] │
└─────────────────────────────────────────┘
```

v2: consent = flag local + header/body acordado com backend quando endpoint de grant existir; até lá, documentar integração com `assertVoiceTrainingConsent`.

---

## 13. Account Settings

**Rota:** `/app/settings`

```
┌──────────────────────────────────────────────────────────┐
│ Configurações                                            │
│                                                          │
│ Perfil                                                   │
│ Email    voce@email.com (somente leitura)                │
│                                                          │
│ Idioma do app                                            │
│ ( ) Português (Brasil)   ( ) English                     │
│                                                          │
│ Privacidade de voz                                       │
│ Status: Consentimento ativo / Não concedido                │
│ [Revogar consentimento]  ← disabled se API ausente       │
│                                                          │
│ [Sair]                                                   │
└──────────────────────────────────────────────────────────┘
```

| Campo | Fonte |
|-------|-------|
| Email | Auth0 `user.email` |
| Locale | app context; persist `localStorage` + cookie |
| Consent | placeholder v2 até API pública |

Troca de locale: re-render imediato; não recarrega rota.

---

## 14. Erros SDK (global)

Mapear `ClientSdkHttpStatusError.code` → copy user-facing:

| code | pt-BR (título) | Ação sugerida |
|------|----------------|---------------|
| `safety_input_blocked` | Conteúdo bloqueado pela política | Editar briefing/referência |
| `safety_input_quarantined` | Conteúdo precisa de ajuste | Revisar material colado |
| `quote_stale` | Preço desatualizado | Refresh preview automático |
| `usage_restricted` | Sem créditos ou limite | Aguardar billing pós-v2 |
| `authentication_expired_token` | Sessão expirada | Re-login |
| `rate_limited` | Muitas tentativas | Aguardar |
| `service_unavailable` | Serviço indisponível | Retry |
| default | Algo deu errado | Retry |

`ClientSdkObservationFailure` → toast separado (não confundir com falha de geração).

Helper: `apps/web/i18n/errors.ts` por code.

---

## 15. Namespaces i18n

```
apps/web/i18n/locales/
├── pt.ts   → app: { shell, auth, onboarding, generate, history, voice, settings, errors, qualityModes, notifications }
└── en.ts   → (espelho)
```

**Regra:** termos de domínio na UI seguem glossário CONTEXT (Formato/Format, Créditos/Credits, Prévia/Preview).

---

## Checklist de aceite (por milestone)

| Tela | Critério |
|------|----------|
| App Shell | Nav + créditos + lista ativa em desktop e mobile |
| Onboarding | Composer compartilhado; 2 passos; skip → reminder |
| Generate | Briefing dinâmico 6 tipos; preview debounce; async create |
| Active UX | Watch + drawer + notification |
| History | Lista + detalhe + regenerar |
| Voice | Dashboard + lista + composer single/batch |
| Settings | Locale + logout + consent placeholder |

---

## Próximo passo após este doc

1. Wireframes visuais (Figma ou ASCII refinado) — opcional  
2. Quebrar em issues por milestone M1–M7  
3. Implementar `field-labels` e `content-types` i18n overlays
