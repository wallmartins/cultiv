# Issue 06-03: Simplificar catálogo público de content types

**Status:** Pendente  
**Prioridade:** Alta  
**Dependências:** Nenhuma  

## Contexto

O fluxo de geração do v1 é orientado por **intenção + escopo** (`intent` + `scope`), não por escolha de canal/mídia. Em `apps/backend/src/product/generation/resolve-generation-target.ts`, quando `intent` e `scope` são enviados, o `contentType` é ignorado com um warning:

```ts
"Ignoring legacy contentType in favor of intent resolution"
```

A rota pública `GET /me/content-types` e o SDK `contentTypes.list()` existem, mas a UI não precisa mais apresentar essa escolha. O backend ainda precisa internamente do mapeamento `intent → legacy content type` para pricing e pipeline.

## Objetivo

Remover a **superfície pública** do catálogo de content types, mantendo o mapeamento interno necessário para geração e preços.

## Escopo

### 1. Backend — rotas

- Remover `GET /me/content-types` de `apps/backend/src/routes/content-type-routes.ts`.
- Remover `GetMeContentTypes` de `apps/backend/src/app/route-definitions.ts`.
- Remover arquivo `apps/backend/src/routes/content-type-routes.ts` se não tiver outro conteúdo.

### 2. SDK

- Remover `contentTypes.list()` de `packages/client-sdk/src/content-types.ts`.
- Remover arquivo `packages/client-sdk/src/content-types.ts`.
- Remover `ContentTypesClient`/`ContentTypesListInput` de `packages/client-sdk/src/index.ts`.
- Remover `contentTypes` do `ClientSdk` em `packages/client-sdk/src/client.ts`.

### 3. Contratos

- Remover `ContentTypeCatalogViewSchema`, `ContentTypeCatalogItemViewSchema`, `ContentTypeCatalogCommercialSchema`, `ContentTypeFieldViewSchema`, `ContentTypeFieldTypeSchema`, `BriefingGuidanceViewSchema`, `ContentTypeDefinitionSchema`, `LanguageProfileSummarySchema` de `packages/contracts/src/content-types.ts`.
- Manter apenas `ContentTypeDefinitionSchema` se for usado internamente pela AI policy.
- Remover decoders não utilizados.
- Avaliar remoção do arquivo `packages/contracts/src/content-types.ts` se não restar conteúdo público.

### 4. Backend — catálogo interno

- Manter `apps/backend/src/product/catalog/content-type-presets.ts` como fonte de `inputSchema` e briefing guidance para os **intents** (via `INTENT_BRIEFING_PRESETS`).
- Manter `apps/backend/src/product/catalog/resolve-catalog-content-types.ts` e a AI policy catalog para uso interno.
- Corrigir `apps/backend/src/product/catalog/content-type-catalog.ts:45`:
  ```ts
  deprecated: true,
  ```
  Esse valor forçado para todos os content types é um bug. Como o catálogo público será removido, esse arquivo pode ser removido ou restringido ao uso interno.

### 5. Geração/preview

- Em `apps/backend/src/product/generation/generation-preview.ts`, o catálogo de content types ainda é usado para montar `options.contentTypes`.
  - Decisão: se a UI não mostrará mais content types, `options.contentTypes` pode ser removido de `GenerationPreviewResponse`.
  - Se mantido para compatibilidade, retornar array vazio ou removê-lo do contrato.
- Em `MeExecutionRequestSchema`, `contentType` pode ser removido ou mantido como campo legado ignorado.

## Arquivos afetados

| Arquivo | Ação |
|---------|------|
| `apps/backend/src/app/route-definitions.ts` | Remover rota |
| `apps/backend/src/routes/content-type-routes.ts` | Remover arquivo |
| `apps/backend/src/product/catalog/content-type-catalog.ts` | Remover ou restringir ao uso interno |
| `apps/backend/src/product/generation/generation-preview.ts` | Remover `options.contentTypes` se aprovado |
| `packages/client-sdk/src/client.ts` | Remover `contentTypes` do SDK |
| `packages/client-sdk/src/content-types.ts` | Remover arquivo |
| `packages/client-sdk/src/index.ts` | Ajustar exports |
| `packages/contracts/src/content-types.ts` | Remover schemas públicos |
| `packages/contracts/src/index.ts` | Ajustar exports |

## Verificação

1. `pnpm build` passa.
2. Type-check do backend passa.
3. `pnpm test` passa sem regressões.
4. `GET /me/content-types` não existe mais.
5. `sdk.contentTypes.list()` não existe mais.
6. Geração por `intent` + `scope` continua funcionando normalmente.

## Decisões pendentes

- `GenerationPreviewResponse.options.contentTypes` deve ser removido ou mantido vazio?
- `MeExecutionRequest.contentType` deve ser removido ou mantido como legado ignorado?

Recomendação: remover ambos para não confundir o frontend. O pricing e o pipeline usam o mapeamento interno `intent → content type`.

## Risco

Médio. Exige ajustar preview e execução para não dependerem do catálogo público. Os testes de preview precisam ser atualizados.
