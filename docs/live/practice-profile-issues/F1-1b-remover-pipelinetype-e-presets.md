# F1-1b · Remover `PipelineTypeSchema` + presets + catálogo de content type

**Fase:** 1 — A cirurgia 07+13
**Caminho crítico:** não
**Depende de:** F1-2, F0-5a (filtro `contentType` já removido)
**Destrava:** F6-4 (re-chavear FEP)
**Origem:** ADR 0010 §7 · plano F1-1 · ticket 07

## Contexto
Os 10 literais do `PipelineTypeSchema` são andaime morto; o `deprecated:true` do catálogo era literal incondicional. Content type deixa de existir como conceito nomeado.

## Mudança
- Remover `PipelineTypeSchema` (`packages/contracts/src/execution/job.ts:11-22`), `CONTENT_TYPE_PRESETS`, `content-type-catalog.ts`/`content-type-presets.ts`.
- `architecture-post`/`validation-post` somem como primeira classe.

## Aceite
- [ ] Nenhum código referencia `PipelineTypeSchema` nem os presets nomeados.
- [ ] `pnpm lint` + `pnpm smoke` verdes.

## Verify
`pnpm vitest run` + `pnpm guardrails:effect`.
