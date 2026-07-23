# F3-3 · Locale na assinatura dos prompts de calibração

**Fase:** 3 — Onboarding
**Caminho crítico:** não
**Depende de:** —
**Destrava:** —
**Origem:** plano F3-3 · ticket 05

## Contexto
`buildStepPrompt`/`resolveTheme` não recebem locale (`voice-calibration-candidates.ts:28`), então o prompt nasce só em pt-BR. O prompt **gerado** deve nascer no idioma pedido.

## Mudança
- Adicionar `locale` à assinatura de `buildStepPrompt`/geração da âncora.

## Aceite
- [ ] Prompt de calibração de um usuário `en` nasce em inglês.

## Verify
`pnpm vitest run` com um caso de locale `en`.
