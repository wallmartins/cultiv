---
title: Design System — direção criativa
doc_type: reference
status: live
domain: design-system
last_updated: 2026-06-22
---

# Cultiv Imprint — direção criativa

## Promessa de marca

*Tecnologia de ponta, feita com alma de artesão.*

A voz do autor deixa uma **marca material** — como letterpress, carimbo ou tinta no papel. A IA **registra**; não apaga. O Imprint traduz esse ato em forma, textura e movimento.

## Três movimentos (ordem de decisão)

Toda escolha visual responde, nesta ordem:

1. **Modernismo** — É funcional e preciso? Se não, remova.
2. **Arts and Crafts** — Transmite cuidado e autenticidade? Se não, acrescente textura ou calor.
3. **Minimalismo** — Desaparece quando o texto deve ser protagonista? Se não, simplifique.

## Metáfora Imprint

| Material | Tradução visual |
|----------|-----------------|
| Papel | `paper`, grain sutil |
| Impressão | press edge, `PressMark` |
| Tinta | pigmentos terracotta / indigo / ochre |
| Leitura | Source Serif 4 em superfícies de conteúdo |

Elementos legados — Playfair, Caveat, ilustrações botânicas, frames editoriais, paleta moss/golden — foram retirados. ADR 0003 (Jardim de Vidro) está **supersedido**.

## Tipografia

*Sans conduz, serif imprime, leitura respira.*

- **Condução** (Bricolage Grotesque): ~85% da interface.
- **Impressão** (Fraunces): no máximo 1–2 ocorrências por viewport.
- **Leitura** (Source Serif 4): 100% das superfícies de conteúdo gerado.

## Intensidade

Marketing e app compartilham tokens e primitives. Só o volume muda:

- **`expressive`** — marketing: grain mais visível, ink bleed, scroll reveal, mais pigmento.
- **`quiet`** — `/app/*`: leitura em primeiro lugar, cromia contida, motion contida.

## Reconhecimento sem logo

Um card Cultiv isolado deve ler: papel + grain, press edge, título em Bricolage, corpo em Source Serif 4, um acento terracotta. Sem botânica, sem gradiente funcional.

## Especificação completa

Tokens, escala tipográfica, motion, rollout e inventário de componentes:

**[Cultiv Imprint — Unified Visual Identity (design spec)](../../superpowers/specs/2026-06-22-cultiv-imprint-identity-design.md)**

Decisão arquitetural: **[ADR 0009 — Cultiv Imprint unified identity](../../adr/0009-cultiv-imprint-identity.md)**
