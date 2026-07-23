# F1-3 · Re-chavear os controles de modo (lentes + instruções) de intent → gênero

**Fase:** 1 — A cirurgia 07+13
**Caminho crítico:** não
**Depende de:** F1-2, F0-4d
**Destrava:** F2-4 (slots leem as lentes)
**Origem:** ADR 0010 §10 · plano F1-2 · tickets 07, 14

## Contexto
`argument-lenses.ts` e `expression-instructions.ts` **já são tabelas** — hoje chaveadas por `GenerationIntent`. Re-chavear pra Modo retórico (não reescrever a estrutura).

## Mudança
- Trocar a chave `Record<GenerationIntent, …>` por `Record<RhetoricalMode, …>` em `argument-lenses.ts` e `expression-instructions.ts`.

## Aceite
- [ ] As tabelas são chaveadas por Modo retórico; `INTENT_LENS_PRIORITY` (que só semeava 3 de 6) morre com o F1-1c.
- [ ] `pnpm lint` verde.

## Verify
`pnpm vitest run` nos testes de lentes/instruções.
