# F1-1c · Remover os 7 pontos de acoplamento do `intent`

**Fase:** 1 — A cirurgia 07+13
**Caminho crítico:** não
**Depende de:** F1-2, F0-5a
**Destrava:** —
**Origem:** ADR 0010 §7, §10 · plano F1-1 · tickets 07, 13

## Contexto
O enum `intent` mongrel morre; 7 pontos ligam nele hoje e saem junto.

## Mudança
Remover: `INTENT_ANGLE`, `PHASE1_LEGACY_INTENT_MAP`, `RHETORICAL_PROFILES`, `defaultPresetByIntentTier`, `INTENT_LENS_PRIORITY`, o filtro Postgres `data->>'generationIntent'`, `MeExecutionRequestSchema.intent`.

## Aceite
- [ ] Nenhum dos 7 símbolos existe; nenhum consumidor referencia `GenerationIntent` a não ser onde o gênero substitui.
- [ ] `pnpm lint` verde.

## Verify
`rg GenerationIntent` retorna só usos intencionais (ou zero); `pnpm vitest run`.
