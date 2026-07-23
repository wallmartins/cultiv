# F0-3b · Web: `buildBriefing()` produz a forma nova

**Fase:** 0 — Contratos & schema
**Caminho crítico:** ⚠️ SIM
**Depende de:** F0-3a
**Destrava:** —
**Origem:** ADR 0010 §6 · ticket 06

## Contexto
`buildBriefing()` (`generate-view.ts:106-132`) para de colapsar em `keyPoints[]` sem rótulo; monta os 6 campos rotulados.

## Mudança
- `buildBriefing()` mapeia as respostas dos slots para `{ topic, audience, payload, anchor, resistance, stake }`.

## Aceite
- [ ] `buildBriefing()` devolve os 6 campos rotulados; sem `keyPoints[]` anônimo.

## Verify
`pnpm vitest run` no teste de `buildBriefing` (ou criar).
