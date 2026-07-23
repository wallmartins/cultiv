# FU-4 · Dedup do mapa de canal (fonte única + round-trip)

**Fase:** Follow-up pós-6 (F6-4)
**Caminho crítico:** não
**Depende de:** —
**Destrava:** —
**Origem:** portão da Fase 6, achado MINOR (seam-drift) do AuditCrossCut

## Contexto
`CHANNEL_WORD_TARGET_FORMAT` (`apps/backend/src/product/generation/compositor/scale.ts`, canal→content-type-string) e `CHANNEL_BY_CONTENT_TYPE` (`apps/backend/src/product/voice/voice-hints.ts`, content-type-string→canal) codificam a **mesma correspondência em direções opostas**, sem fonte compartilhada nem teste. Não são inversas exatas — `CHANNEL_BY_CONTENT_TYPE` tem entradas legadas a mais (`long-form-blog`, `validation-post`, `architecture-post`). Uma 6ª entrada num arquivo e esquecida no outro → **drift silencioso** (TS não pega).

## Mudança
- Extrair uma tabela declarativa única canal ↔ content-types num módulo compartilhado; derivar as duas direções dela.
- Teste de round-trip/consistência.

## Aceite
- [x] Uma fonte; adicionar canal/content-type toca 1 lugar; teste guarda a consistência bidirecional.

## Resolução (2026-07-22)
Fonte única: `apps/backend/src/product/generation/channel-content-types.ts` — tabela
`CHANNEL_CONTENT_TYPES` (canal → lista ordenada de content-types; o 1º é o formato canônico do
word-target, os demais são aliases legados só pra volta). Ambas as direções derivam dela:
`channelPrimaryContentType(channel)` (consumido por `compositor/scale.ts`) e `channelForContentType(ct)`
(consumido por `voice/voice-hints.ts`). Os dois `Record` locais divergentes foram removidos. Teste de
round-trip/consistência: `apps/backend/tests/channel-content-types.test.ts` (6 casos — cobertura por
canal, round-trip do formato canônico, reverso de todo alias, unicidade do content-type, sentinela
`unspecified`, e paridade com os valores que os dois call-sites codificavam).

## Verify
`pnpm vitest run` no teste de round-trip novo.
