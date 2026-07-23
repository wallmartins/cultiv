# F0-4b · Atualizar o prompt de extração para os 7 valores de postura

**Fase:** 0 — Contratos & schema
**Caminho crítico:** não
**Depende de:** F0-4a
**Destrava:** —
**Origem:** ADR 0010 §10 · ticket 14

## Contexto
O prompt de extração lista os valores válidos na mão (`argument-development-extraction.ts:142,209,226`) e faz default `"exploratory"`.

## Mudança
- Atualizar a lista de valores para os 7 + `not_applicable`; reconsiderar o default (neutro, não `exploratory`).

## Aceite
- [ ] O prompt oferece os 8 valores; o default não força argumentativo.

## Verify
`pnpm vitest run` na extração de argument-development.
