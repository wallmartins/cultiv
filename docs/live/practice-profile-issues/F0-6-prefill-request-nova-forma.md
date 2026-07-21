# F0-6 · `BackendGenerationPrefillRequest` muda de forma

**Fase:** 0 — Contratos & schema
**Caminho crítico:** não
**Depende de:** F0-3a
**Destrava:** F4-3
**Origem:** ADR 0010 §6 · ticket 06

## Contexto
O prefill deixa de classificar intent e passa a instanciar os 4 slots — a forma do request muda (`generation-prefill-types.ts:5-9`).

## Mudança
- Redefinir `BackendGenerationPrefillRequest` para carregar tema + o necessário pra instanciar os slots (não intent).

## Aceite
- [ ] O contrato do prefill reflete a forma nova; sem campo de intent.

## Verify
`pnpm vitest run` no contrato do prefill.
