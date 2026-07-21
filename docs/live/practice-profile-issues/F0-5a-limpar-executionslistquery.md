# F0-5a · Limpar `intent` + `contentType` de `ExecutionsListQuerySchema`

**Fase:** 0 — Contratos & schema
**Caminho crítico:** não
**Depende de:** —
**Destrava:** F1-1b, F1-1c
**Origem:** ADR 0010 §7 · ticket 15

## Contexto
`intent` e `contentType` no filtro são **dormentes** (a web só expõe q/status/period). Saem limpos, sem perda pro usuário. `lengthTier` fica.

## Mudança
- Remover `intent` + `contentType` de `ExecutionsListQuerySchema` (`list-query.ts:12-21`), `normalizeExecutionsListFilters`, `matchesExecutionsListFilters:89`, `ExecutionsListFilterItem.generationIntent`.

## Aceite
- [ ] O schema/matcher não referenciam `intent`/`contentType`; `lengthTier`/`q`/`status`/`period` intactos.

## Verify
`pnpm vitest run` no filtro de execuções.
