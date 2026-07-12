# Tarefa 01: Remoção do Código Morto (Concluída)

**Status:** ✅ Concluída em 2025-07-06
**ADR:** `docs/adr/0001-remove-voice-example-import-flow.md`

## O que foi feito

### Contratos (packages/contracts/src/voice.ts)
- Removido: `VoiceExampleCreateInputSchema`, `VoiceExampleUpdateInputSchema`
- Removido: `VoiceExampleBatchCreateInputSchema`, `VoiceExampleBatchItemInputSchema`, `VoiceExampleBatchItemsInputSchema`
- Removido: `VoiceExampleBatchItemResultViewSchema`, `VoiceExampleBatchViewSchema`, `VoiceExampleBatchCommitResultViewSchema`
- Removido: Todos os decoders correspondentes

### Domínio (packages/domain/src/voice.ts)
- Removido: `VoiceExampleDraft`, `VoiceExampleBatchItem`, `VoiceExampleBatch`
- Removido: `createVoiceExampleBatch()`

### Database (packages/database/)
- Removido: `VoiceExampleBatchRepository`, `VoiceExampleBatchRecord`
- Removido: Batch converters, batch errors, batch service tag
- Deletado: `repositories/voice-example-batch-repository.ts`

### Backend (apps/backend/src/)
- Deletado: `product/voice/voice-lifecycle-mutations.ts`
- Removido: Batch protection functions em `safety/voice-field-protection.ts`
- Removido: Batch rotation logic em `safety/voice-field-protection-rotation.ts`
- Deletado: `infra/postgres-repositories/postgres-voice-example-batch-repository.ts`
- Atualizado: `postgres-client.ts` (removido batch repo wiring)
- Atualizado: `postgres-tables.ts` (removido `voice_example_batches` de `DatabaseTables`)

### Testes
- Deletados: 55 arquivos de teste UI/web/governance
- Atualizados: 12 arquivos de teste backend/contract/database
- Pulados: 9 testes que usam o fluxo antigo

## Resultado
- Build: ✅ passa
- Testes: 214 arquivos passando, 889 testes passando, 40 pulando
