---
title: Product Showcase — Visual Asset Bible
doc_type: reference
status: draft
domain: marketing-surface
last_updated: 2026-06-11
parent_prd: docs/live/prd/cultiv-product-showcase-restructure.md
---

# Product Showcase — Visual Asset Bible

Pacote gráfico para aprovação **antes** da implementação das issues 12–15.

## Formato de entrega por asset

| Faixa | Formato em produção | Pasta `svg/` |
|-------|---------------------|--------------|
| **A01–A06** | **Componentes React** (`currentColor`, tokens, `data-draw-stroke`) | Referência de design apenas — não `<img>` |
| **A08, A10** | **SVG estático** (arquivo) | Fonte de verdade exportável |

A01–A06 em código permitem: mesma paleta semântica da página, motion GSAP (`draw-stroke`, stagger), texto via i18n, `prefers-reduced-motion`, e nitidez em qualquer DPR sem assets raster.

## Princípios

| Chromia (gramática) | Cultiv (material) |
|---------------------|-------------------|
| Hierarquia forte, scroll focus | Papel quente, bordas retas, grain |
| Blocos visuais por seção | Tipografia e botânica — não fotos |
| Contraste claro/escuro pontual | `showcase` só no capítulo 1 + waitlist invert |

**Tokens obrigatórios** (ver `packages/ui` theme):

| Token | Hex | Uso |
|-------|-----|-----|
| surface | `#f5f0e8` | Fundo principal |
| surface-elevated | `#faf7f2` | Balões, blocos elevados |
| foreground | `#1e2f2a` | Texto, bordas editoriais |
| muted | `#5c6b66` | Texto secundário, clichês |
| ghost | `#ddd4c8` | Placeholder genérico |
| moss | `#6b9080` | Acento, labels |
| golden | `#d4a843` | Destaque sutil |
| showcase | `#243830` | Capítulo teaser |
| showcase-muted | `#a8bdb2` | Labels em fundo escuro |

**Tipografia nos SVGs de referência:**

- Display / títulos em cenas: Playfair Display (serif)
- Corpo genérico: Inter
- Manuscrito / prompt frágil: Caveat
- Meta / índices: JetBrains Mono

---

## Inventário de assets

| ID | Asset | Seção | Produção | Ref. design | Issue |
|----|-------|-------|----------|-------------|-------|
| A01 | Generic Output Stack | Problema 1 | `GenericOutputStack.tsx` | `svg/a01-…` | 12 |
| A02 | Fragile Prompt Collage | Problema 2 | `FragilePromptCollage.tsx` | `svg/a02-…` | 12 |
| A03 | Solution Breath layout | Solution Breath | `SolutionBreathSection` + bubbles | `svg/a03-…` | 13 |
| A04 | Teach Voice Scene | Diferenc. cap. 2 | `TeachVoiceScene.tsx` | `svg/a04-…` | 15 |
| A05 | Briefing Scene | Diferenc. cap. 3 | `BriefingScene.tsx` | `svg/a05-…` | 15 |
| A06 | Preview Confidence Scene | Diferenc. cap. 4 | `PreviewConfidenceScene.tsx` | `svg/a06-…` | 15 |
| A07 | Flow Stem (desktop) | Da voz ao texto | `BotanicalStem` default | — | 14 |
| A08 | Flow Stem (mobile) | Da voz ao texto | **SVG** → `BotanicalStem` variant | `svg/a08-…` | 14 |
| A09 | Waveform accent | Diferenc. cap. 1 | `WaveformScript` | — | 15 |
| A10 | OG share image | SEO | **SVG** → `public/cultiv-og.svg` | `svg/a10-…` | 10 |
| — | Showcase teaser | Diferenc. cap. 1 | layout UI + teaser copy | — | 15 |

**Reutilizar sem novo desenho:** `BotanicalTree`, `FallingLeavesLayer`, `HandwrittenNote`, `LetterReveal`, `IllustrationFrame`, `ComparisonCard` / teaser columns.

---

## A01 — Generic Output Stack

**Narrativa:** três blocos de output idênticos em estrutura — monocultura textual.

**Copy fantasma (PT, não traduzir no SVG final — virá do i18n):**

1. *"Em um mundo cada vez mais acelerado…"*
2. *"A produtividade não é sobre trabalhar mais horas…"*
3. *"No final do dia, o que importa é entregar…"*

**Layout:**

- 3 retângulos empilhados, `border: 1px solid foreground`, fundo `ghost` a 12% opacity
- Barras de linha simuladas (retângulos muted/ghost), não texto longo renderizado
- Índice opcional `[genérico]` em mono moss — discreto

**Dimensões alvo:** ~480×360 viewBox; escala fluida na coluna visual (max ~420px largura).

**Motion (implementação):** fade-up stagger das barras; `data-draw-stroke` na borda externa opcional.

**Critério de aprovação:** leitura instantânea de “tudo igual” sem parecer mock de app.

---

## A02 — Fragile Prompt Collage

**Narrativa:** fragmentos de prompt desconectados — esforço manual.

**Fragmentos (PT):**

- Caveat: *"escreva como EU…"*
- Mono: *tom: reflexivo, direto*
- Tracejado: *evite listas de dicas*
- Nota solta: *exemplo de estilo (não copie)*

**Layout:**

- 3–4 cartões desalinhados com `border dashed border-subtle`, rotação ±2°
- Sem ícone de ChatGPT; sem logo de terceiros

**Dimensões alvo:** ~480×400 viewBox.

**Motion:** leve stagger + translateY por cartão no reveal.

---

## A03 — Solution Breath layout

**Não é ilustração narrativa** — guia de composição para dev/design.

- Nota manuscrita topo
- Cultiv centro (display italic)
- Subtítulo abaixo
- 4 balões em constelação assimétrica (posições % documentadas no SVG)

**Interação:** micro-copy abaixo do balão no hover/tap — não tooltip flutuante.

---

## A04 — Teach Voice Scene

**Narrativa:** exemplos reais orbitando um núcleo vazio que será “perfil”.

**Snippets (PT):**

- *"post no LinkedIn"*
- *"email para cliente"*
- *"artigo do blog"*

**Material:** molduras finas + mono meta; 3 cartões em arco; opacidade decrescente nos laterais.

---

## A05 — Briefing Scene

**Narrativa:** briefing guiado substitui prompt monolítico.

**Campos (labels PT):**

1. Formato → `LinkedIn`
2. Objetivo → `…`
3. Audiência → `…`
4. Ângulo → `…`

**Layout:** formulário editorial vertical, campos com `border-b` apenas (estilo waitlist invert mas em surface).

---

## A06 — Preview Confidence Scene

**Narrativa:** prévia de créditos + snippet antes de confirmar.

**Elementos:**

- Linha meta: *"12 créditos · voice match alto"*
- Caixa de snippet (2 linhas muted)
- Botão fantasma *"Confirmar"* desabilitado (opacity 0.45)

**Fundo:** surface-elevated; borda editorial.

---

## A07 / A08 — Flow stems

**Desktop:** componente existente `BotanicalStem` variant `default` (viewBox 120×320).

**Mobile:** `a08-flow-stem-compact.svg` — caule único, sem ramificações laterais; altura ~200px equivalente.

**Motion:** `data-draw-stroke` no path principal ao entrar na viewport; sem scrub no fluxo.

---

## A10 — OG share image

Substituir tagline *"YOUR AUTHENTICITY, AT SCALE"* por:

- PT: *"TEXTOS QUE SOAM COMO VOCÊ"* (ou versão bilíngue dupla se OG único)
- EN preview file: mesmo layout, linha em inglês

Após aprovação, copiar para `apps/web/public/cultiv-og.svg`.

---

## Showcase teaser (capítulo 1)

**Sem SVG dedicado.** Composição:

- Fundo `showcase`
- `WaveformScript` topo
- Duas colunas comparativo (reuso padrão ComparisonCard)
- Preview curto LinkedIn — copy em `content/showcase/themes/linkedin-post.ts` (teaser strings separadas de `genericOutput` / `voiceOutput` completos)

**Teaser copy target:** ~180–220 caracteres por coluna.

---

## Checklist de aprovação gráfica

Antes de iniciar issues 12–15:

- [ ] A01 e A02 aprovados (problema)
- [ ] A03 aprovado (posições dos balões)
- [ ] A04–A06 aprovados (capítulos leves)
- [ ] A08 aprovado (stem mobile)
- [ ] A10 aprovado (OG)
- [ ] Copy PT/EN dos snippets alinhada ao tom **Brand Tone**
- [ ] Nenhum asset usa ícones de marca terceira (ChatGPT, etc.)

---

## Implementação em código (A01–A06)

Padrão igual ao restante do marketing (`BotanicalTree`, `WaveformScript`):

```tsx
// IlustraçãoFrame + currentColor + paper-grain opcional
// Texto de cena via props ou slots i18n — não paths SVG hardcoded em PT
export function GenericOutputStack({ lines }: { lines: readonly string[] }) {
  return (
    <IllustrationFrame aria-hidden>
      {/* rects + text from props; stroke hooks: data-draw-stroke */}
    </IllustrationFrame>
  );
}
```

| Regra | Motivo |
|-------|--------|
| `currentColor` / tokens CSS | Herda `text-foreground`, `text-muted`, `text-moss` do section parent |
| Copy via props / i18n | PT/EN sem duplicar SVG |
| `aria-hidden` no decorative | Copy acessível fica na coluna de texto da seção |
| Sem `<img src="…">` | Performance, tema, animação |

**Aprovação:** validar composição nos SVGs de referência; a implementação React deve ser fiel ao layout, não pixel-identical export.

## Assets estáticos (A08, A10)

| Asset | Destino |
|-------|---------|
| A08 | Incorporar paths em `BotanicalStem` variant `flow-compact` (ou arquivo SVG importado uma vez no componente) |
| A10 | Copiar `a10-og-share.svg` → `apps/web/public/cultiv-og.svg` após aprovação |
