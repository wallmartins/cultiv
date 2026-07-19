# Issue 06-05: Corrigir type-check do backend

**Status:** Pendente  
**Prioridade:** **Crítica**  
**Dependências:** 06-02 (parcial)  

## Contexto

`pnpm build` passa porque o backend usa esbuild, que não faz type-check. Porém, o type-check TypeScript está quebrado:

```bash
pnpm --filter @my-ai-orchestrator/backend exec tsc -p tsconfig.json --noEmit
```

Falha com múltiplos erros. Isso é perigoso: o código pode estar quebrado em tempo de execução sem que o build detecte.

## Erros atuais

### 1. `VoiceExampleCreateInput` / `VoiceExampleUpdateInput` removidos mas ainda referenciados

```
src/product/voice/voice-types.ts(6,3): error TS2305:
  Module '"@my-ai-orchestrator/contracts"' has no exported member 'VoiceExampleCreateInput'.
src/product/voice/voice-types.ts(8,3): error TS2305:
  Module '"@my-ai-orchestrator/contracts"' has no exported member 'VoiceExampleUpdateInput'.
```

**Causa:** esses tipos foram removidos dos contratos na Tarefa 01 (ADR 0001), mas `apps/backend/src/product/voice/voice-types.ts` ainda os importa e usa nos métodos `createExample` e `updateExample`.

**Ação:** como a superfície pública de exemplos será removida na Issue 06-02, remover `createExample` e `updateExample` de `BackendVoiceService`. Se forem mantidos internamente (não recomendado), recriar os tipos localmente ou usar tipos inline.

### 2. Type mismatch em `attentionReasonCodes`

```
src/product/voice/voice-lifecycle.ts(...):
  The types of 'evaluation.attentionReasonCodes' are incompatible...
```

**Causa:** o contrato `AttentionReasonCodeSchema` define valores específicos (`language_conflict`, `redundant_example`, `too_short`, `low_specificity`, `format_specific_only`, `conflicts_with_profile`, `excluded_from_profile`). Em `voice-lifecycle.ts`, o campo é criado como `string[]` vazio e o retorno não casa com o tipo esperado.

**Ação:** tipar corretamente os arrays como `AttentionReasonCode[]` ou usar `as const` quando apropriado. Ajustar `voice-mappers.ts` se necessário.

### 3. `voiceExampleBatchesRotated` não existe mais

```
src/cli/rotate-voice-protection-key.ts(46,53):
  Property 'voiceExampleBatchesRotated' does not exist on type 'VoiceFieldProtectionRotationResult'.
```

**Causa:** o campo foi removido junto com o fluxo de batches (Tarefa 01), mas o CLI ainda o referencia.

**Ação:** remover a referência ao campo inexistente no CLI.

### 4. Retorno de `createExample`/`updateExample` incompatível

`voice-lifecycle.ts` retorna objetos que não casam com `VoiceExampleListItemView` devido ao problema de `attentionReasonCodes`. Isso será resolvido automaticamente ao remover esses métodos ou ao corrigir o tipo.

## Escopo

### 1. Remover métodos obsoletos de `BackendVoiceService`

Em `apps/backend/src/product/voice/voice-types.ts`:
- Remover `createExample` e `updateExample` da interface.
- Remover imports de `VoiceExampleCreateInput` e `VoiceExampleUpdateInput`.

### 2. Ajustar ou remover `voice-lifecycle.ts`

- Se `createExample`/`updateExample` forem removidos, simplificar `voice-lifecycle.ts` ou removê-lo.
- Se mantidos para uso interno, corrigir os tipos.
- Recomendação: remover, pois não há mais fluxo de importação de exemplos.

### 3. Corrigir CLI de rotação de chave

Em `apps/backend/src/cli/rotate-voice-protection-key.ts`:
- Remover referência a `voiceExampleBatchesRotated`.

### 4. Corrigir `voice-lifecycle-list.ts` se necessário

- Se `listExamples` for removido na Issue 06-02, este arquivo pode ser removido também.

## Arquivos afetados

| Arquivo | Ação |
|---------|------|
| `apps/backend/src/product/voice/voice-types.ts` | Remover `createExample`/`updateExample` e imports inválidos |
| `apps/backend/src/product/voice/voice-lifecycle.ts` | Remover ou corrigir tipos |
| `apps/backend/src/product/voice/voice-lifecycle-list.ts` | Remover se `listExamples` for removido |
| `apps/backend/src/cli/rotate-voice-protection-key.ts` | Remover referência a campo inexistente |

## Verificação

1. `pnpm build` passa.
2. `pnpm --filter @my-ai-orchestrator/backend exec tsc -p tsconfig.json --noEmit` passa sem erros.
3. `pnpm test` passa sem regressões.

## Risco

**Alto se não for feito antes do frontend.** Type-check quebrado indica inconsistências reais que podem causar bugs em runtime. Deve ser uma das primeiras issues executadas.
