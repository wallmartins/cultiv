# Issue 06-01: Remover `formatExpressions` do domínio de voz

**Status:** Pendente  
**Prioridade:** Alta  
**Dependências:** Nenhuma  

## Contexto

`formatExpressions` era a caracterização da voz do autor **por formato/canal** (LinkedIn, newsletter, blog etc.), com campos como `register`, `openingStyle` e `technicalDensity`. Com a mudança para um fluxo orientado por **intenção** e não por canal/mídia, esse conceito deixou de fazer sentido.

Hoje ele é extraído durante o Voice Profile Rebuild, mas **não é persistido** em `DerivedVoiceProfile` e **não é consumido** na geração de texto. O mapper `toVoiceReasoningPresentationView` retorna `formatExpressions: []` sempre vazio.

## Objetivo

Remover `formatExpressions` completamente do domínio de voz, eliminando código morto e simplificando os contratos.

## Escopo

### 1. Contratos (`packages/contracts/src/`)

- Remover `FormatExpressionProfileSchema` de `reasoning.ts`.
- Remover campo `formatExpressions` de:
  - `ReasoningExtractionResultSchema`
  - `UnifiedVoiceSignatureSchema`
  - `VoiceReasoningPresentationViewSchema`
- Remover exports e decoders relacionados (`decodeFormatExpressionProfile`).
- Atualizar `packages/contracts/src/index.ts` se necessário.

### 2. Backend — extração (`apps/backend/src/product/voice/reasoning-extraction.ts`)

- Remover lógica de `formatExpressions` do prompt de extração.
- Remover `filterFormatExpressionsByCoverage` (ou simplificar para retornar apenas `core`).
- Remover agrupamento por content type usado apenas para `formatExpressions`.
- Ajustar `extractReasoningSignature` para retornar apenas `core`.

### 3. Backend — reconciliação (`apps/backend/src/product/voice/voice-signature-reconciliation.ts`)

- Remover `formatExpressions` do prompt de reconciliação.
- Ajustar `reconcileVoiceSignatures` para retornar apenas `core` e `development`.

### 4. Backend — mapper (`apps/backend/src/product/voice/voice-mappers.ts`)

- Remover `formatExpressions: []` de `toVoiceReasoningPresentationView`.

### 5. Backend — pipeline de rebuild (`apps/backend/src/product/voice/voice-rebuild-pipeline.ts`)

- Ajustar onde `reasoning.formatExpressions` é lido/escrito.
- Remover log `formatExpressionCount`.

### 6. Backend — fallback (`apps/backend/src/product/voice/voice-signature-brief-fallback.ts`)

- Remover `formatExpressions: {}` do fallback.

### 7. Testes

- Atualizar fixtures que referenciam `formatExpressions` (ex: `apps/backend/src/execution/pipeline/provider-transport.ts:270`).
- Atualizar testes que validam a presença de `formatExpressions`.

## Arquivos afetados

| Arquivo | Ação |
|---------|------|
| `packages/contracts/src/reasoning.ts` | Remover schemas e decoders |
| `packages/contracts/src/index.ts` | Ajustar exports se necessário |
| `apps/backend/src/product/voice/reasoning-extraction.ts` | Remover do prompt e lógica |
| `apps/backend/src/product/voice/voice-signature-reconciliation.ts` | Remover do prompt e retorno |
| `apps/backend/src/product/voice/voice-mappers.ts` | Remover do mapper |
| `apps/backend/src/product/voice/voice-rebuild-pipeline.ts` | Ajustar uso |
| `apps/backend/src/product/voice/voice-signature-brief-fallback.ts` | Remover do fallback |
| `apps/backend/src/execution/pipeline/provider-transport.ts` | Ajustar fixture de teste |
| Testes que referenciam `formatExpressions` | Atualizar |

## Verificação

1. `pnpm build` passa.
2. `pnpm --filter @my-ai-orchestrator/backend exec tsc -p tsconfig.json --noEmit` passa.
3. `pnpm test` passa sem regressões.
4. `VoiceReasoningPresentationView` não contém mais `formatExpressions`.

## Risco

Baixo. O campo não é consumido em produção nem persistido no profile derivado.
