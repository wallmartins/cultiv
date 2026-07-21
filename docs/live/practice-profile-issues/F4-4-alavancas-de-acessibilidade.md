# F4-4 · Alavancas de acessibilidade de público via prompt

**Fase:** 4 — Geração
**Caminho crítico:** não
**Depende de:** F4-1, F2-4
**Destrava:** F4-5
**Origem:** ADR 0010 §11 · plano F4-4 · tickets 12, 08

## Contexto
Público é soberano sobre **acessibilidade** (nunca sobre a voz). Alavancas: densidade de jargão + se explicado (vocabulário da dimensão Léxico; o público modula quanto), pressuposição, rampa de contexto, encerramento.

## Mudança
- Instrução de prompt que modula as 4 alavancas a partir de `briefing.audience` + a dimensão Léxico. **A voz nunca é sobrescrita.**

## Aceite
- [ ] Mesma tese, 2 públicos → 2 densidades de jargão/rampa distintas, **mesma voz**.

## Verify
Gerar o caso do 12 (CTOs vs. o time) e conferir a diferença de acessibilidade sem deriva de voz.
