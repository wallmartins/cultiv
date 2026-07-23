# F1-1a · Remover o ramo legado de `resolve-generation-target`

**Fase:** 1 — A cirurgia 07+13
**Caminho crítico:** não
**Depende de:** F1-2
**Destrava:** —
**Origem:** ADR 0010 §7 · plano F1-1 · ticket 07

## Contexto
Com o compositor sendo o caminho vivo (prod) e re-chaveado (F1-2), o ramo legado que resolve `legacyContentTypeId` é andaime morto.

## Mudança
- Remover o ramo não-compositor de `resolve-generation-target.ts:113-133` e `legacyContentTypeId` (`intent-resolver.ts`).

## Aceite
- [ ] `resolveGenerationTarget` só tem o caminho do compositor; sem `legacyContentTypeId`.
- [ ] `pnpm lint` verde.

## Verify
`pnpm vitest run` nos testes de resolução de target.
