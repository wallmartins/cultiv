# F1-1d · Deletar código morto da calibração

**Fase:** 1 — A cirurgia 07+13
**Caminho crítico:** não
**Depende de:** F3-4 (a ponta do seam trocada pela âncora gerada)
**Destrava:** —
**Origem:** ADR 0010 §5 · plano F1-3 · ticket 05

## Contexto
Código morto por construção que o 05 identificou — o `themePool` é inalcançável (a tela 1 exige `domain`, o sorteio só roda sem).

## Mudança
Deletar: `THEMES_BY_DOMAIN`, `themePool`, `pickThemeFromPool`, `rotationIndex`, `step.label`, `capturesFeatures`, `argument_development.defaultTheme`.

## Aceite
- [ ] Nenhum dos símbolos existe; a calibração usa a âncora gerada (F3-4).
- [ ] `pnpm lint` verde.

## Verify
`pnpm vitest run` nos testes de calibração.
