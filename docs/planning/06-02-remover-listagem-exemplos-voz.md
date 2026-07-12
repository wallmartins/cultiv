# Issue 06-02: Remover listagem pública de exemplos de voz

**Status:** Pendente  
**Prioridade:** Alta  
**Dependências:** Nenhuma  

## Contexto

No v1, os exemplos de voz são produzidos **apenas pelo onboarding de calibração**. O usuário não importa textos, não edita exemplos e não os gerencia individualmente. Portanto, a listagem pública de exemplos (`GET /me/voice-profile/examples`), os filtros (`state`, `pinned`, `contentType`) e o conceito de `pinned` não são mais necessários na superfície pública.

Os exemplos continuam sendo **persistidos internamente** e usados pelo Voice Profile Rebuild.

## Objetivo

Remover a listagem pública de exemplos de voz da API, do SDK e dos contratos, mantendo apenas a criação interna via wizard.

## Escopo

### 1. Backend — rotas

- Remover `GET /me/voice-profile/examples` de `apps/backend/src/routes/voice-routes.ts`.
- Remover `GetMeVoiceProfileExamples` de `apps/backend/src/app/route-definitions.ts`.
- Remover funções helper de parse de query (`parseListOptions`, etc.) se não forem usadas em outro lugar.

### 2. Backend — serviço

- Remover `listExamples` de `BackendVoiceService` (`apps/backend/src/product/voice/voice-types.ts`).
- Remover `createVoiceLifecycleOperations` ou ajustá-lo para não expor `listExamples`, `createExample`, `updateExample`.
- Avaliar remoção de `voice-lifecycle-list.ts` e `voice-lifecycle.ts` se não tiverem mais uso público.
  - **Atenção:** `voice-lifecycle.ts` ainda referencia `VoiceExampleCreateInput`/`VoiceExampleUpdateInput`, que já foram removidos dos contratos. Isso será tratado na Issue 06-05.

### 3. SDK

- Remover `voice.listExamples()` de `packages/client-sdk/src/voice.ts`.
- Remover `VoiceListExamplesInput` e exports relacionados de `packages/client-sdk/src/index.ts`.

### 4. Contratos

- Remover `VoiceExamplesPageViewSchema` e `VoiceExampleListItemViewSchema` de `packages/contracts/src/voice.ts`.
- Remover decoders relacionados (`decodeVoiceExamplesPageView`, `decodeVoiceExampleListItemView`).
- Remover tipos auxiliares que só existiam para a listagem, se aplicável.

### 5. Domain

- Avaliar se `VoiceExample.state`, `VoiceExample.pinned`, `VoiceExample.explicitContentType`, `VoiceExample.channel`, `VoiceExample.format` e `VoiceExample.evaluation` ainda são necessários no domínio.
  - `state`, `pinned`, `channel`, `format`, `explicitContentType` podem ser removidos se não houver mais UI de gerenciamento.
  - Manter `classificationLabels`, `effectiveContentTypeHints` e `evaluation` apenas se forem usados pelo rebuild.
  - **Decisão de produto:** se o rebuild não precisar desses campos, removê-los simplifica o modelo. Caso contrário, mantê-los apenas no domínio interno.

### 6. Banco de dados

- Não remover a tabela `voice_examples` nem os dados.
- Se campos do domain forem removidos, avaliar se as colunas JSON permitem compatibilidade retroativa.

## Arquivos afetados

| Arquivo | Ação |
|---------|------|
| `apps/backend/src/app/route-definitions.ts` | Remover rota |
| `apps/backend/src/routes/voice-routes.ts` | Remover endpoint e helpers |
| `apps/backend/src/product/voice/voice-types.ts` | Remover `listExamples` da interface |
| `apps/backend/src/product/voice/voice-lifecycle-list.ts` | Remover ou restringir |
| `apps/backend/src/product/voice/voice-lifecycle.ts` | Remover ou restringir |
| `packages/client-sdk/src/voice.ts` | Remover `listExamples` |
| `packages/client-sdk/src/index.ts` | Ajustar exports |
| `packages/contracts/src/voice.ts` | Remover schemas de listagem |
| `packages/contracts/src/index.ts` | Ajustar exports |
| `packages/domain/src/voice.ts` | Avaliar simplificação do `VoiceExample` |

## Verificação

1. `pnpm build` passa.
2. Type-check do backend passa.
3. `pnpm test` passa sem regressões.
4. `GET /me/voice-profile/examples` não existe mais.
5. `sdk.voice.listExamples()` não existe mais.

## Risco

Médio. Se campos do domain `VoiceExample` forem removidos, precisa garantir que o rebuild e o wizard ainda funcionem. Recomenda-se fazer essa remoção em duas etapas: primeiro a superfície pública, depois a simplificação do domain.
