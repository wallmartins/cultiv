# FU-5 · Dupla resolução de voz no caminho síncrono

**Fase:** Follow-up pós-6 (defeito de corretude/eficiência)
**Caminho crítico:** não
**Depende de:** —
**Destrava:** —
**Origem:** portão da Fase 6, achado NOTE do AuditFEP · roteado ao **mapa de defeitos** (ver FU-6)

## Contexto
No caminho síncrono, a voz efetiva é resolvida **duas vezes**: `apps/backend/src/execution/index.ts:162` (gate de disponibilidade + metadata da resposta) e, de novo, `runtime-selection.ts:58` via `executeSyncRun` (pra geração real). **Cada uma persiste sua própria linha** em `voiceProfileSnapshots`. Pré-existente (o F6-4 só trocou a chave de extração de `contentType` pra `channel`). Custo: 2× resolução (2 chamadas de LLM-adjacentes/IO) + 2 snapshots por geração síncrona.

## Mudança
- Resolver a voz **uma vez** e passar o resultado adiante (ou memoizar por request), preservando o gate de disponibilidade E a persistência única do snapshot.

## Aceite
- [x] 1 resolução + 1 snapshot por geração síncrona; gate de disponibilidade intacto.

## Resolução (2026-07-22)
O gate de disponibilidade (`execution/index.ts`) já resolve a voz efetiva (`effectiveVoice`, tipo
`EffectiveVoiceResolution`) antes de ramificar sync/async. Passei esse resultado adiante via um campo
opcional novo `preresolvedVoice` em `ExecutePipelineOptions`; `resolveRuntimeSelectionContext`
(`runtime-selection.ts`) agora faz `options.preresolvedVoice ?? (yield* resolveEffectiveVoice(...))`,
então **reusa** a resolução do gate em vez de resolver de novo. Resultado: 1 resolução + 1 snapshot
por geração síncrona; o gate segue intacto (o `if (!effectiveVoice) fail(...)` continua lá). O
fallback preserva os outros chamadores que não pré-resolvem (o worker async em `jobs/worker-job.ts`,
que já resolvia uma única vez). Como efeito colateral bom, o `voice` reportado na resposta passa a ser
exatamente o mesmo usado na geração (antes podiam divergir no caso-borda sem `language` no request).

## Verify
Teste que conta chamadas de `resolveEffectiveVoice` / `voiceProfileSnapshots.create` numa geração síncrona.
→ `apps/backend/tests/voice-single-resolution.test.ts`: no seam `resolveRuntimeSelectionContext`, com
`preresolvedVoice` presente ⇒ 0 chamadas a `resolveEffectiveVoice`; ausente ⇒ 1 chamada. (Snapshot é
persistido *dentro* de `resolveEffectiveVoice`, então contar as chamadas conta os snapshots.)

## Nota
Pertence ao **mapa de defeitos de corretude** (`.scratch/defeitos-de-corretude/`); pode ser feito standalone ou dobrado no plano do FU-6.
