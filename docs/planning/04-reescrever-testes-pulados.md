# Tarefa 04: Reescrever Testes Pulados

**Status:** Pendente
**Prioridade:** Média
**Dependências:** Tarefa 03 (Step 0 Context Setup)

## Objetivo

Reescrever os 9 testes que foram pulados durante a remoção do código morto, substituindo o uso de `services.voice.createExample()` por fixtures JSON ou fluxo de calibração.

## Testes pulados

### Arquivo: `tests/backend/backend-voice-service.test.ts`
1. `it.skip("creates and lists enriched voice examples")` — Usa `createExample` com channel/explicitContentType
2. `it.skip("enforces pinned limits")` — Usa `createExample` para testar limits de pin

### Arquivo: `tests/backend/backend-voice-rebuild.test.ts`
3. `it.skip("derives profile and diagnostics asynchronously after example mutations")`
4. `it.skip("triggers rebuild after example create and promotes the committed version")`
5. `it.skip("raises confidence when the user has enough diverse active examples")`
6. `it.skip("keeps language conflict and low coverage visible in diagnostics")`

### Arquivo: `tests/backend/backend-audit-trail.test.ts`
7. `it.skip("persists voice mutation audits across restart")`

### Arquivo: `tests/backend/backend-observability.test.ts`
8. `it.skip("records rebuild, commit, snapshot and refresh signals")`

### Arquivo: `apps/backend/tests/voice-training-consent.test.ts`
9. `it.skip("preserves Derived Voice Profile as the generation-time voice source of truth")`

## Abordagem de reescrita

### Opção A: Fixtures JSON (recomendada para testes de rebuild/observability)

Criar fixtures JSON com `VoiceExample` objects pré-criados, injetados diretamente no repositório de teste.

**Vantagens:**
- Rapidez (inserção direta no DB/memory store)
- Isolamento (testes não dependem de calibração)
- Estabilidade (fixtures são imutáveis)

**Desvantagens:**
- Fidelidade menor (não passam pelo wizard real)
- Manutenção de fixtures (se schema mudar, precisa atualizar JSONs)

### Opção B: Calibração Flow (recomendada para testes de service)

Usar o fluxo de calibração real para criar exemplos em testes.

**Vantagens:**
- Fidelidade ao fluxo real
- Cobertura acidental (se wizard falhar, testes falham)

**Desvantagens:**
- Mais lento
- Acoplamento (testes de outros módulos dependem de calibração)

### Recendação: Híbrido

| Tipo de teste | Abordagem |
|---|---|
| Testes de **service** (voice-service) | Opção B — usar calibração |
| Testes de **rebuild** (voice-rebuild) | Opção A — fixtures JSON |
| Testes de **audit/observability** | Opção A — fixtures JSON |
| Testes de **consent** | Opção B — usar createExample com consent checking |

## Criar helper de teste

Criar um helper `createCalibratedExample()` que simula internamente o fluxo de calibração:

```ts
// tests/backend/test-helpers.ts
export function createCalibratedExample(
  database: DatabaseClient,
  userId: string,
  input: { text: string; language?: string; channel?: string; context?: string }
): VoiceExampleRecord {
  // 1. Criar exemplo diretamente no DB
  // 2. Retornar o record criado
}
```

## Arquivos afetados

| Arquivo | Ação |
|---------|------|
| `tests/backend/test-helpers.ts` | Atualizar — adicionar `createCalibratedExample()` |
| `tests/backend/backend-voice-service.test.ts` | Atualizar — reescrever testes 1 e 2 |
| `tests/backend/backend-voice-rebuild.test.ts` | Atualizar — reescrever testes 3-6 |
| `tests/backend/backend-audit-trail.test.ts` | Atualizar — reescrever teste 7 |
| `tests/backend/backend-observability.test.ts` | Atualizar — reescrever teste 8 |
| `apps/backend/tests/voice-training-consent.test.ts` | Atualizar — reescrever teste 9 |

## Verificação

1. `pnpm build` — deve passar
2. `pnpm test` — todos os testes devem passar (nenhum skip)
3. Verificar que os testes reescritos cobrem os mesmos cenários dos originais
