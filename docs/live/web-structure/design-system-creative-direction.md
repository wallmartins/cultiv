---
title: Design System — direção criativa
doc_type: reference
status: live
domain: design-system
last_updated: 2026-06-23
---

# Cultiv Cartography — direção criativa

## Promessa de marca

*Sua voz. Seu território. Suas palavras.*

A voz do autor é **território mapeável** — expedições, rotas, coordenadas. A IA **explora**; não apaga. A Cartography traduz esse ato em forma, textura e movimento.

## Três movimentos (ordem de decisão)

Toda escolha visual responde, nesta ordem:

1. **Modernismo** — É funcional e preciso? Se não, remova.
2. **Arts and Crafts** — Transmite cuidado e autenticidade? Se não, acrescente textura ou calor.
3. **Minimalismo** — Desaparece quando o texto deve ser protagonista? Se não, simplifique.

## Metáfora Cartography

| Conceito | Tradução visual |
|----------|-----------------|
| Território | Seções como folhas de atlas com rótulos de coordenada |
| Rota | Linha SVG conectando seções e passos do wizard |
| Bússola | `CompassMark` — logo e âncora de navegação |
| Expedição | Wizard de geração; histórico como logbook |
| Coordenadas | Campos de formulário, breadcrumbs, tags mono |

Elementos legados — Imprint, PressMark, Bricolage, Fraunces, Source Serif 4, `imprint-grain`, `press-edge`, ilustrações botânicas — foram retirados. ADR 0009 (Imprint) está **supersedido** por ADR 0010.

## Tipografia

*Playfair conduz autoridade, Inter conduz interface, Caveat anota margens.*

- **Autoridade** (Playfair Display): títulos display e logbook.
- **Condução** (Inter): ~85% da interface.
- **Margem** (Caveat): no máximo 1–2 ocorrências por viewport.
- **Coordenadas** (JetBrains Mono): meta técnica e índices §01 · …

## Superfície

Marketing e app compartilham tokens e primitives. Só o volume muda:

- **`data-surface="marketing"`** — grain mais visível, parallax, scroll reveal, mais pigmento.
- **`data-surface="workspace"`** — leitura em primeiro lugar, cromia contida, motion contida.

## Reconhecimento sem logo

Um card Cultiv isolado deve ler: **cream + borda pontilhada + Playfair + acento terracotta**. Sem botânica, sem gradiente funcional, sem press edge.

## Especificação completa

Tokens, escala tipográfica, motion, rollout e inventário de componentes:

**[Cultiv Cartography — Complete Platform Redesign (design spec)](../../superpowers/specs/2026-06-23-cultiv-cartography-redesign-design.md)**

Decisão arquitetural: **[ADR 0010 — Cultiv Cartography unified identity](../../adr/0010-cultiv-cartography-identity.md)**
