# F1-2 · Re-chavear `planGeneration` de intent → gênero × tamanho × canal

**Fase:** 1 — A cirurgia 07+13
**Caminho crítico:** ⚠️ SIM
**Depende de:** F0-4d (contrato Rhetorical Mode), F0-3a (forma do briefing)
**Destrava:** F1-1a/b/c (remover andaime), F2-4 (slots), F4-3
**Origem:** ADR 0010 §7, §10 · plano F1-2 · tickets 07, 13

## Contexto
O compositor já compõe de `intent × scope × qualityMode` → `planSignature` (`COMPOSITOR_V1_ENABLED=true` em prod). A **substância** da cirurgia 07+13 é trocar a chave `intent` (enum mongrel morto) por **gênero (Modo retórico) × tamanho × canal**. É uma passada só com o 13, não duas.

## Mudança
- `planGeneration()` (`compositor/compositor-planner.ts`) passa a compor por gênero × tamanho × canal.
- A inferência de gênero migra pro 1º passo da geração (não classifica intent no prefill — coordenar com F0-6/F4-3).

## Aceite
- [ ] `planGeneration` não referencia `GenerationIntent`; compõe pelos 3 eixos novos.
- [ ] `planSignature` reflete a composição nova; pricing por tamanho intacto (sem redecidir 0006).
- [ ] `pnpm lint` + `pnpm smoke` verdes.

## Verify
`pnpm vitest run` nos testes do compositor + `apps/backend/scripts/compositor-parity-harness.ts` (paridade da composição).
