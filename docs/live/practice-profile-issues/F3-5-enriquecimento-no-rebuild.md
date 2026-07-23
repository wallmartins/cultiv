# F3-5 · Enriquecimento do perfil no rebuild de `completeReview`

**Fase:** 3 — Onboarding
**Caminho crítico:** não
**Depende de:** F2-2 (G2), F0-1b (diagnostics store)
**Destrava:** —
**Origem:** ADR 0010 §4 · plano F3-5 · tickets 05, 03

## Contexto
Roda no rebuild de `completeReview`, **pós-consentimento**, uma vez, **só-acrescenta**. Das 3 disparadas de rebuild, só a de `completeReview` é pós-consentimento.

## Mudança
- Task própria ou passo em `processUserRebuild` (`voice-rebuild-pipeline.ts`) que roda G2 e grava as sugestões na store de diagnostics (aceite/rejeite pelo autor em F5-2).

## Aceite
- [ ] Enriquecimento roda uma vez pós-consentimento; só-acrescenta; sugestões na store separada.

## Verify
`pnpm vitest run` no pipeline de rebuild com o passo de enriquecimento.
