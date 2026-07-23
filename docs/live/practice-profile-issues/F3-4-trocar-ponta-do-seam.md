# F3-4 · Trocar a ponta do seam de calibração pela âncora gerada

**Fase:** 3 — Onboarding
**Caminho crítico:** não
**Depende de:** F2-3 (G3), F3-1
**Destrava:** F1-1d
**Origem:** plano F3-4 · ticket 05

## Contexto
`setContext()`→`refreshSessionStepPrompts()`→`buildStepPrompt()` (`voice-calibration-service.ts:290-292`) **já** reescreve as telas 2–5. Só trocar a ponta (`resolveTheme`/`THEMES_BY_DOMAIN`) pela âncora do G3 — não construir o caminho.

## Mudança
- `buildStepPrompt` consome a âncora gerada (G3) em vez de `resolveTheme`.

## Aceite
- [ ] Telas 2–5 recebem prompts ancorados no Practice Profile; `THEMES_BY_DOMAIN` deixa de ser lido (deletado no F1-1d).

## Verify
Onboarding local em 2 domínios → prompts distintos e ancorados.
