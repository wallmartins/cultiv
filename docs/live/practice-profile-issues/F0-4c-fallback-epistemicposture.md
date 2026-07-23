# F0-4c · Atualizar `inferEpistemicPosture` (fallback) para os 7 valores

**Fase:** 0 — Contratos & schema
**Caminho crítico:** não
**Depende de:** F0-4a
**Destrava:** —
**Origem:** ADR 0010 §10 · ticket 14

## Contexto
O fallback determinístico (`voice-signature-brief-fallback.ts:232,252`) mapeia pra postura sem os valores novos.

## Mudança
- `inferEpistemicPosture` passa a poder devolver qualquer um dos 7 + `not_applicable`.

## Aceite
- [ ] O fallback cobre os valores não-argumentativos.

## Verify
`pnpm vitest run` no fallback com briefs de modos distintos.
