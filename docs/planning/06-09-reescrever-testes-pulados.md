# Issue 06-09: Reescrever testes pulados

**Status:** Pendente  
**Prioridade:** Média  
**Dependências:** 06-02, 06-05, 06-07  

## Contexto

Após a remoção do fluxo antigo de importação de exemplos (Tarefa 01), 9 testes foram pulados (`it.skip`) porque dependiam de `services.voice.createExample()`.

Além disso, as issues 06-01 a 06-08 podem introduzir novos testes pulados ou quebrados que precisam ser reescritos.

## Objetivo

Reescrever todos os testes pulados, substituindo o uso de `createExample`/`updateExample` por fixtures JSON ou pelo fluxo real de calibração.

## Testes pulados atuais

### `tests/backend/backend-voice-service.test.ts`
1. `creates and lists enriched voice examples` — usa `createExample` com channel/explicitContentType
2. `enforces pinned limits` — usa `createExample` para testar limites de pin

### `tests/backend/backend-voice-rebuild.test.ts`
3. `derives profile and diagnostics asynchronously after example mutations`
4. `triggers rebuild after example create and promotes the committed version`
5. `raises confidence when the user has enough diverse active examples`
6. `keeps language conflict and low coverage visible in diagnostics`

### `tests/backend/backend-audit-trail.test.ts`
7. `persists voice mutation audits across restart`

### `tests/backend/backend-observability.test.ts`
8. `records rebuild, commit, snapshot and refresh signals`

### `apps/backend/tests/voice-training-consent.test.ts`
9. `preserves Derived Voice Profile as the generation-time voice source of truth`

## Abordagem

| Tipo de teste | Abordagem |
|---------------|-----------|
| Testes de **service** (voice-service) | Usar fluxo de calibração real |
| Testes de **rebuild/reasoning** | Fixtures JSON com exemplos pré-criados |
| Testes de **audit/observability** | Fixtures JSON com exemplos pré-criados |
| Testes de **consent** | Usar fluxo de calibração real |

## Helper de teste

Criar/atualizar helper em `tests/backend/test-helpers.ts`:

```ts
export function createCalibratedExample(
  database: DatabaseClient,
  userId: string,
  input: { text: string; language?: string }
): VoiceExampleRecord {
  // 1. Criar exemplo diretamente no DB, simulando o wizard
  // 2. Retornar o record criado
}
```

## Arquivos afetados

| Arquivo | Ação |
|---------|------|
| `tests/backend/test-helpers.ts` | Adicionar helper |
| `tests/backend/backend-voice-service.test.ts` | Reescrever testes 1 e 2 |
| `tests/backend/backend-voice-rebuild.test.ts` | Reescrever testes 3-6 |
| `tests/backend/backend-audit-trail.test.ts` | Reescrever teste 7 |
| `tests/backend/backend-observability.test.ts` | Reescrever teste 8 |
| `apps/backend/tests/voice-training-consent.test.ts` | Reescrever teste 9 |

## Verificação

1. `pnpm test` passa.
2. Nenhum `it.skip` relacionado a voz permanece.
3. `pnpm --filter @my-ai-orchestrator/backend exec tsc -p tsconfig.json --noEmit` passa.

## Risco

Médio. Testes de rebuild com fixtures podem perder fidelidade em relação ao wizard real. Recomenda-se manter pelo menos um teste de integração do wizard.
