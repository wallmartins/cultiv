# Issue 06-10: Atualizar `docs/frontend-backend-contracts.md`

**Status:** Pendente  
**Prioridade:** Média  
**Dependências:** 06-01 a 06-08  

## Contexto

O documento `docs/frontend-backend-contracts.md` foi revisado e identificou-se que ele está correto na maioria dos contratos, mas incompleto para guiar a implementação total do frontend. Após as issues 06-01 a 06-08 serem executadas, o documento precisa ser atualizado para refletir o estado real do backend e SDK.

## Objetivo

Atualizar o documento de contratos para que seja a fonte da verdade completa e precisa para o frontend.

## Escopo

### 1. Remover contratos obsoletos

- Remover seção sobre `contentTypes.list()` e `GET /me/content-types`.
- Remover seção sobre `voice.listExamples()` e `GET /me/voice-profile/examples`.
- Remover campos `formatExpressions` de `VoiceReasoningPresentationView`.

### 2. Adicionar novos contratos

- Adicionar subclient `onboarding`:
  - `onboarding.complete()`
  - `onboarding.getStatus()`
- Adicionar `voice.revokeConsent()`.
- Atualizar `BillingEntitlementView` com `currency`.

### 3. Atualizar fluxo do wizard

- Incluir step `context_setup` como tela 1.
- Atualizar a numeração das telas (agora 7 telas no total).

### 4. Atualizar seções de "Confirmed Behaviors" e "Known Gaps"

- Mover Onboarding Completion de "Known Gaps" para "Implemented".
- Mover Voice Consent Revoke de "Known Gaps" para "Implemented".
- Adicionar nota sobre o type-check do backend e esbuild.
- Adicionar nota sobre `apps/web` ainda não existir.

### 5. Corrigir inconsistências documentadas

- Remover menção a `deprecated: true` universal (depois de corrigido).
- Atualizar `VoiceProfileScreenView` para não conter `formatExpressions`.

### 6. Adicionar seção de estado do type-check

- Documentar que `pnpm build` usa esbuild (sem type-check).
- Documentar que `pnpm --filter @my-ai-orchestrator/backend exec tsc -p tsconfig.json --noEmit` deve passar.

## Arquivos afetados

| Arquivo | Ação |
|---------|------|
| `docs/frontend-backend-contracts.md` | Revisar e atualizar completo |

## Verificação

1. Documento reflete o estado real do backend e SDK.
2. Não há contratos no documento que não existam no código.
3. Não há contratos no código público que não estejam documentados.

## Risco

Baixo. Apenas documentação, mas deve ser a última issue do backend/SDK para garantir consistência.
