# F4-3 · Prefill instancia os 4 slots (em vez de classificar intent)

**Fase:** 4 — Geração
**Caminho crítico:** ⚠️ SIM
**Depende de:** F2-4 (G4), F0-6 (forma do prefill)
**Destrava:** —
**Origem:** ADR 0010 §6, §10 · plano F4-3 · tickets 06, 13

## Contexto
`generation-prefill.ts` troca de trabalho: deixa de classificar intent de `theme+language` e passa a instanciar os 4 slots (G4). Mesma chamada, mesmo orçamento. A inferência de gênero migra pro 1º passo.

## Mudança
- Reescrever o prefill para chamar G4; a saída mapeia sobre a forma nova do `BackendGenerationPrefillRequest` (F0-6).

## Aceite
- [ ] Prefill devolve os 4 slots redigidos + gênero inferido; não classifica intent.

## Verify
`pnpm vitest run` no prefill + eval de ~15 temas (afinar o prompt).
