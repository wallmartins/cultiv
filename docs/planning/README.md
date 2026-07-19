# Planejamento: Novo Fluxo de Calibração de Voz

> Sessão de grilling realizada em 2025-07-06. Documento de referência para implementação do frontend.

## Contexto

O Cultiv é um motor de escrita com IA que gera textos na voz do autor. O backend está implementado; o frontend precisa ser construído. Esta sessão mapeou todos os contratos backend-frontend, decisões de produto, e o escopo de trabalho necessário.

## Decisões Consolidadas

### 1. SDK é a única forma de comunicação

**Regra fundamental:** O frontend NUNCA faz chamadas HTTP diretas ao backend. Toda comunicação passa pelo `@my-ai-orchestrator/client-sdk`.

O SDK expõe subclients e métodos alinhados ao escopo v1:
- `preview.get()` — pré-visualização de geração
- `executions.create/get/list/watch()` — execuções
- `voice.getProfile/getConsentStatus/grantConsent/revokeConsent/recordTraitConfirmation()` — voz
- `voiceCalibration.startSession/getSession/setContext/getStepPrompt/submitStep/skipStep/completeReview/getEntitlement()` — calibração
- `generationIntents.list()` — intenções de geração
- `billing.createCheckout/getEntitlement()` — faturamento
- `onboarding.complete/getStatus()` — onboarding completion

> **Removidos do escopo v1:** `contentTypes.list()` e `voice.listExamples()` (ver Plano 06).

### 2. Calibração é o único caminho de criação de perfil

**Decisão:** O fluxo antigo de importação de textos (`VoiceExampleComposer`, batch CRUD) foi removido (ADR 0001). A calibração é o único entry point para criar perfil de voz.

**Fluxo do wizard (7 telas — step `context_setup` ainda não implementado no backend):**

| Tela | Step ID | Tipo | Conteúdo |
|------|---------|------|----------|
| 1 | `context_setup` | **Formulário** | Temática (obrig), público (obrig), pontos fortes (opc) |
| 2 | `micro_opinion` | **Escrever** | "Qual é a sua opinião sobre {theme}?" — 60-100 palavras |
| 3 | `reasoning_reflection` | **Escrever** | "Conte sobre algo que você aprendeu recentemente..." — 150-250 palavras |
| 4 | `argument_development` | **Escrever** | "Defenda uma posição sobre algo que importa para você." — 250-400 palavras |
| 5 | `format_adaptation` | **Escrever** | "Explique algo que você sabe bem para alguém que não conhece." — 180-300 palavras |
| 6 | `review_confirm` | **Revisar** | Review dos textos, confirmação. Mostra confidence e resumo do perfil |
| 7 | `success`/`error` | **Resultado** | Confirmação de sucesso, ou erro com botão retry |

**Contexto (Tela 1):**
- `domain` (obrigatório): "Qual é a sua temática principal?"
- `audience` (obrigatório): "Para qual público você costuma escrever?"
- `selfDeclaredStrength` (opcional): "O que você considera seus pontos fortes como escritor?"
- Enviado via `POST /me/voice-calibration/sessions/:sessionId/context`

**Retry em erro:** Chamar `completeReview()` novamente (idempotente). Sem voltar a steps anteriores.

**Entitlements:**

| Plano | Max Sessões | Cobra Quota | Max Confidence |
|-------|-------------|-------------|----------------|
| free | 1 | sim | medium |
| criador | 10 | não | high |
| pro | 10 | não | high |

### 3. Onboarding Completion no backend

**Decisão:** Implementar `POST /me/onboarding/complete` e `GET /me/onboarding/status`. Backend é a fonte de verdade.

**Implementação necessária:**
- Nova migration: adicionar `onboarding_completed_at` na tabela `application_users`
- Nova rota: `POST /me/onboarding/complete`
- Nova rota: `GET /me/onboarding/status`
- Novos métodos no SDK: `onboarding.complete()`, `onboarding.getStatus()`
- Chamado após `completeReview()` com sucesso no wizard

### 4. Imported Context habilitado em v1

O campo `importedContext?: string` está habilitado no `MeExecutionRequest`. Passa pelo Input Safety Gateway com política própria. Truncado para 8.000 caracteres max. Enviado ao LLM como `Imported context: {text}` inline no prompt.

### 5. SSE usa JWT Bearer via fetch

O endpoint SSE `GET /me/executions/:id/events` usa o **mesmo JWT Bearer** que todas as rotas `/me/*`. O SDK usa `fetch()` (não `EventSource`) porque `EventSource` não suporta headers customizados de Authorization.

### 6. InputSchema suficiente para form dinâmico

O schema `ContentTypeFieldView` tem: `key`, `label`, `type`, `required`, `highImpact`, `helpText?`, `options?`

- `type: "string"` → input single-line
- `type: "text"` → textarea
- `type: "enum"` → select com `options`
- `highImpact` → tratamento visual diferenciado
- **Gaps:** Sem `placeholder`, `maxLength`, `defaultValue`. Tipo `array` não tem sub-schema.

### 7. Testes: abordagem híbrida

| Tipo de teste | Abordagem |
|---|---|
| Testes de **calibração** | Exercise o wizard real |
| Testes de **voice rebuild/reasoning** | Fixtures JSON com exemplos pré-criados |
| Testes de **generation/billing** | Fixtures JSON com profile pré-calculado |

---

### 8. Catálogo de content types e listagem de exemplos serão removidos

- `GET /me/content-types` e `sdk.contentTypes.list()` não fazem mais parte do escopo v1.
- O fluxo de geração é orientado por `intent` + `scope`; o mapeamento interno `intent → content type` continua existindo para pricing/pipeline.
- `GET /me/voice-profile/examples` e `sdk.voice.listExamples()` não fazem mais parte do escopo v1.
- Os exemplos de voz continuam sendo criados internamente pelo onboarding de calibração e usados pelo rebuild.

### 9. `formatExpressions` será removido

- `formatExpressions` (caracterização da voz por canal/formato) será removido dos contratos, extração e reconciliação.
- O `VoiceReasoningPresentationView` passará a conter apenas `core` (como eu penso) e `development` (como eu desenvolvo um texto).

### 10. `BillingEntitlementView` retornará `currency`

- `GET /me/billing/entitlement` passará a incluir `currency: "BRL" | "USD"`.

### 11. Type-check do backend deve passar

- `pnpm build` usa esbuild e não faz type-check.
- `pnpm --filter @my-ai-orchestrator/backend exec tsc -p tsconfig.json --noEmit` deve passar sem erros antes de iniciar o frontend.

---

## Arquivos de Documentação

| Arquivo | Descrição |
|---------|-----------|
| `00-resumo-tarefas.md` | Índice consolidado de tarefas e do Plano 06 |
| `01-remocao-codigo-morto.md` | ✅ Concluído — remoção do fluxo antigo de importação |
| `02-onboarding-completion-backend.md` | Pendente — onboarding completion (será substituído/atualizado pelo 06-06) |
| `03-step0-context-setup.md` | Pendente — step 0 do wizard (será substituído/atualizado pelo 06-07) |
| `04-reescrever-testes-pulados.md` | Pendente — reescrever testes pulados (será substituído/atualizado pelo 06-09) |
| `05-frontend-implementation.md` | Pendente — implementação do frontend |
| `06-backend-contract-cleanup-plan.md` | Plano mestre dos ajustes de backend/SDK/contratos |
| `06-01-*` a `06-11-*` | Issues detalhadas do Plano 06 |

## Referências

- `docs/frontend-backend-contracts.md` — Contratos completos SDK por tela
- `docs/adr/0001-remove-voice-example-import-flow.md` — ADR da remoção
- `CONTEXT.md` — Glossário de domínio atualizado
