# F0-3c · Backend: `getBriefingText()` serializa campos rotulados

**Fase:** 0 — Contratos & schema
**Caminho crítico:** ⚠️ SIM
**Depende de:** F0-3a
**Destrava:** —
**Origem:** ADR 0010 §6 · ticket 06

## Contexto
`getBriefingText()` (`skill-inputs.ts:24-52`) hoje serializa `Topic/Goal/Key points` anônimos. Passa a serializar os 6 campos rotulados pra LLM saber o que é evidência vs. objeção.

## Mudança
- `getBriefingText()` serializa `topic/audience/payload/anchor/resistance/stake` rotulados; degradação = omitir a chave (nunca placeholder vazio).

## Aceite
- [ ] Serialização rotulada; omissão graciosa de campo ausente.

## Verify
`pnpm vitest run` em `skill-inputs`.
