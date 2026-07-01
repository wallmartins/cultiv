# Prompt para Visualização — Landing Page Cultiv (Anti-Slop)

> Copie e cole no v0, Relume, ou similar para gerar um wireframe/protótipo da landing page redesign.
> Este prompt é deliberadamente antipadrão para evitar a estética genérica de "AI SaaS template".

---

## Anti-Slop Directive

```
CRITICAL INSTRUCTION — READ BEFORE GENERATING:

This is NOT a typical SaaS landing page. Do NOT use any of the following patterns:

FORBIDDEN VISUAL PATTERNS:
- No gradient backgrounds (no purple-to-blue, no mesh gradients, no aurora effects)
- No glassmorphism / frosted glass / backdrop-blur
- No floating 3D elements, blob shapes, or geometric decorations
- No hero section with a fake dashboard screenshot or app mockup
- No generic "burst" or "sparkle" illustrations around CTAs
- No dark mode sections alternating with light (no "zebra striping")
- No stock photos of people smiling at laptops
- No generic AI/robot/brain illustrations
- No abstract wave or curve section dividers
- No colored section backgrounds (no purple sections, blue sections, green sections)
- No card hover effects that scale up or rotate in 3D
- No parallax scrolling effects
- No scroll-triggered animations beyond simple fade-in-up
- No floating navigation that morphs on scroll
- No "as seen on" logo strip of companies
- No circular avatar photos next to testimonials (use name + role only)
- No progress bars or completion indicators that look gamified

FORBIDDEN TYPOGRAPHY PATTERNS:
- No ultra-thin font weights (no hairline, no 100 weight)
- No mixed case headlines with random words highlighted in accent color
- No text gradients (text filled with a gradient)
- No massive display type that requires scrolling to read one word
- No letter-spacing so wide it looks like a fashion magazine

FORBIDDEN LAYOUT PATTERNS:
- No hero section that takes more than 80vh
- No equal-width 3-column grids for everything (use varied layouts)
- No pricing cards that all look identical except for a "popular" badge
- No testimonials in a horizontal carousel (show all 3 visible at once)
- No accordion FAQ that starts with everything closed (open the first one)
- No floating "back to top" button
- No sticky CTA bar on mobile (the page is short enough)

WHAT THIS PAGE SHOULD FEEL LIKE:
- A well-designed editorial spread in a design magazine
- Paper materiality — warm, tactile, human
- Typography-led hierarchy (the words are the design)
- Quiet confidence, not loud conversion pressure
- One dominant color per viewport (terracotta for CTAs, cream for reading)
- Every element earns its space — if it doesn't help the reader, remove it
```

---

## Prompt Principal

```
Build a landing page for "Cultiv" — an AI writing tool that measures how you write and generates text constrained by your voice metrics.

LANGUAGE: Portuguese (Brazil).

DESIGN SYSTEM — Cultiv Cartography:

COLORS (flat only, no gradients):
- Background: #FFFBF5 (warm cream, not white)
- Primary text: #1A2E3C (deep blue, not black)
- Secondary text: #6B7280 (warm gray)
- Muted text: #9CA3AF (light gray)
- CTA / Accent: #C75B39 (terracotta, flat fill)
- CTA hover: #B04E30 (darker terracotta)
- Warm accent: #D4A056 (ochre, used sparingly)
- Border: #1A2E3C at 15% opacity
- Card background: #FFFBF5 (same as page, differentiated by border only)

TYPOGRAPHY — 4 roles only:
- Headlines: Playfair Display, 700 weight, -0.01em letter-spacing
  Size: 48px desktop / 32px mobile
  Line-height: 1.15
- Body: Inter, 400 weight, 0px letter-spacing
  Size: 16px desktop / 15px mobile
  Line-height: 1.65
- UI labels: Inter, 500 weight
  Size: 14px
  Line-height: 1.4
- Metrics/Technical: JetBrains Mono, 400 weight
  Size: 28px for values, 13px for labels
  Line-height: 1.2

SPACING:
- Section vertical padding: 96px desktop / 64px mobile
- Content max-width: 1080px, centered
- Card padding: 32px
- Gap between cards: 24px
- Space between section eyebrow and title: 12px
- Space between section title and content: 48px

BORDERS:
- Cards: 1px solid border at 15% opacity, no shadow
- Border radius: 5px (everywhere, no exceptions)
- No box-shadows on any element except pricing "popular" card (0 2px 8px at 5% opacity)

---

PAGE STRUCTURE:

### 1. NAVIGATION
- Fixed position, cream background, 1px bottom border at 15% opacity
- Height: 64px
- Left: "Cultiv" wordmark in Playfair Display 700, 20px, #1A2E3C
- Center: 4 text links in Inter 500, 14px, #6B7280
  "Como funciona" · "Preços" · "Perguntas" · "Diário de bordo"
  Hover: #1A2E3C
- Right: CTA button
- No logo icon, no compass, no decorative elements in nav

### 2. HERO
- Vertical padding: 80px top, 48px bottom (deliberately asymmetric — more breathing room above)
- Max-width: 680px, centered (narrower than full container for reading comfort)

Headline:
"Cole 5 textos seus. Veja como você realmente escreve."
Playfair Display 700, 48px, #1A2E3C, centered, max-width 600px, margin: 0 auto

Subheadline:
"Cultiv extrai métricas reais da sua escrita — ritmo, formalidade, vocabulário — e gera textos com sua assinatura. Não um prompt genérico."
Inter 400, 17px, #6B7280, centered, max-width 540px, margin: 20px auto 0

CTA:
Button "Começar grátis"
Background: #C75B39, color: white, Inter 500, 15px
Padding: 14px 32px, border-radius: 5px
Margin-top: 32px

Microcopy:
"Crie seu perfil de voz. 10 gerações no plano Explorador."
Inter 400, 13px, #9CA3AF, centered, margin-top: 12px

Proof line:
"Usado por autores que mapearam sua voz."
Inter 400, 13px, #9CA3AF, centered, margin-top: 48px
No icons, no avatars, no logos — just text

### 3. INTERACTIVE DEMO
- Background: same cream (no color change)
- Section eyebrow: "Experimente agora"
  Inter 500, 13px, #C75B39, uppercase, letter-spacing 0.05em
- Section title: "Cole um parágrafo da sua escrita"
  Playfair Display 700, 32px, #1A2E3C

Layout (desktop): 2 columns, 55% / 45% split, gap 48px

LEFT COLUMN — Input:
- Label: "Cole um parágrafo da sua escrita" (Inter 500, 14px, #1A2E3C)
- Textarea: full width, min-height 160px
  Border: 1px solid #1A2E3C at 15%, border-radius 5px
  Background: white (#FFFFFF), not cream
  Padding: 16px, Inter 400, 15px, #1A2E3C
  Placeholder: "Cole aqui um texto que você escreveu..."
- Button: "Analisar meu texto" below textarea
  Same style as hero CTA, full width

RIGHT COLUMN — Results (appears after analysis):
6 metric cards in 3x2 grid, gap 16px

Each card:
- Background: white (#FFFFFF)
- Border: 1px solid #1A2E3C at 15%
- Border-radius: 5px
- Padding: 20px
- No shadow, no hover effect

Card content:
Line 1: Metric name (Inter 500, 13px, #6B7280)
Line 2: Value (JetBrains Mono 400, 28px, #1A2E3C)
Line 3: Qualitative label (Inter 400, 13px, #9CA3AF)

Example card:
  "Ritmo"
  "18.3"
  "palavras por frase"

Below metrics: Comparison section
- Section title: "Comparação" (Inter 500, 14px, #6B7280)
- 2 columns, equal width, gap 24px

Left column (your text):
- Label: "Seu texto" (Inter 500, 13px, #C75B39)
- Quote in quotes: Inter 400, 15px, #1A2E3C, font-style italic
- Below quote: 3 metric lines in JetBrains Mono 13px

Right column (generic):
- Label: "ChatGPT genérico" (Inter 500, 13px, #9CA3AF)
- Quote: Inter 400, 15px, #9CA3AF, font-style italic
- Below quote: 3 metric lines in JetBrains Mono 13px, #9CA3AF

Final CTA:
"Começar grátis — Crie seu perfil de voz completo"
Same button style, centered below comparison

### 4. PROBLEM SECTION
- Background: slightly elevated cream (#FEFCF8) — barely noticeable, just enough to separate
- Section eyebrow: "O problema"
- Section title: "Todo mundo está publicando o mesmo texto."

3 cards, horizontal row (desktop), stacked (mobile)

Each card:
- Background: transparent (no fill)
- Border: 1px solid #1A2E3C at 15%
- Border-radius: 5px
- Padding: 32px

Card number: Large JetBrains Mono 400, 48px, #D4A056 at 20% opacity (watermark effect)
Title: Inter 500, 17px, #1A2E3C, margin-top: 16px
Body: Inter 400, 15px, #6B7280, line-height 1.65, margin-top: 12px

No icons, no illustrations, no images in cards. Typography only.

### 5. COMPARISON TABLE
- Background: cream (back to default)
- Section eyebrow: "A diferença é real"
- Section title: "Mesmo briefing. Dois resultados."

Table layout (NOT a traditional table — use div-based layout):

Header row:
- Column 1: "O que importa" (Inter 500, 14px)
- Column 2: "ChatGPT (seu prompt)" (Inter 500, 14px, #9CA3AF)
- Column 3: "Cultiv (sua voz)" (Inter 500, 14px, #C75B39)
- Column 4: "Trabalho manual" (Inter 500, 14px, #9CA3AF)

6 data rows:
- Alternating backgrounds: transparent / #FEFCF8
- Each cell: Inter 400, 15px
- "Não" in #9CA3AF, "Sim" in #1A2E3C
- Column 3 cells: slight left border in #C75B39 (2px, solid)

Below table, verdict:
"Autenticidade não é luxo. É o que faz seu público voltar."
Playfair Display 700, 24px, #1A2E3C, centered, margin-top: 48px

### 6. HOW IT WORKS
- Background: #FEFCF8 (elevated)
- Section eyebrow: "Como funciona"
- Section title: "Em 5 passos, sua escrita vira perfil de voz"

5 steps, vertical list with numbered circles

Each step:
- Left: Step number in a circle
  Circle: 40px, border: 2px solid #C75B39, no fill
  Number: Inter 500, 16px, #C75B39
- Right: Title + description
  Title: Inter 500, 17px, #1A2E3C
  Description: Inter 400, 15px, #6B7280, margin-top: 4px
- Between steps: vertical line, 1px, #1A2E3C at 10% opacity, 24px tall

No icons, no illustrations, no progress bars.

### 7. PRICING
- Background: cream
- Section eyebrow: "Planos"
- Section title: "Crie seu perfil grátis. Pague quando quiser gerar."

Toggles (centered, above cards):
- Monthly/Annual: pill toggle, Inter 500, 14px
  Active: #1A2E3C background, white text
  Inactive: transparent, #6B7280 text
  "Economize 20%" badge next to "Anual": #D4A056 background, 12px, Inter 500
- BRL/USD: same pill toggle below

3 cards, equal width, gap 24px

Standard cards (Explorador, Profissional):
- Background: white
- Border: 1px solid #1A2E3C at 15%
- Border-radius: 5px
- Padding: 32px

Highlighted card (Criador):
- Same as above + box-shadow: 0 2px 8px rgba(26,46,60,0.05)
- "Mais popular" badge: #C75B39 background, white text, Inter 500, 12px, padding 4px 12px, border-radius 3px, positioned top-right

Card structure:
- Badge (top): Inter 500, 12px, #C75B39 (or #9CA3AF for non-highlighted)
- Price: JetBrains Mono 700, 40px, #1A2E3C
- Period: Inter 400, 14px, #6B7280
- Divider: 1px solid #1A2E3C at 10%, margin 20px 0
- Features: list with Inter 400, 14px, #6B7280
  Checkmark: #C75B39 (use simple ✓ character, not an icon library)
- Footer text: Inter 400, 13px, #9CA3AF
- CTA button: full width, same style as hero CTA

### 8. TESTIMONIALS
- Background: #FEFCF8
- No section eyebrow or title (testimonials speak for themselves)

3 cards, horizontal row, gap 24px

Each card:
- Background: white
- Border: 1px solid #1A2E3C at 15%
- Border-radius: 5px
- Padding: 32px

Content:
- Opening quote mark: Playfair Display 700, 48px, #D4A056 at 30% opacity
- Quote text: Inter 400, 15px, #1A2E3C, font-style italic, line-height 1.65
- Attribution: Inter 500, 14px, #6B7280, margin-top: 20px
  Format: "Nome, Cargo" (no dash, no "—")

No photos, no avatars, no social media handles.

### 9. FAQ
- Background: cream
- Section eyebrow: "Perguntas"
- Section title: "Tire suas dúvidas"

Accordion, max-width 720px, centered

Each item:
- Border-bottom: 1px solid #1A2E3C at 10%
- Padding: 20px 0

Question:
- Inter 500, 16px, #1A2E3C
- Plus/minus indicator on right: Inter 400, 20px, #6B7280
  (Use + when closed, − when open — not chevrons, not arrows)

Answer:
- Inter 400, 15px, #6B7280, line-height 1.65
- Padding-top: 12px

First item: OPEN by default.

### 10. FINAL CTA
- Background: #1A2E3C (dark section — the ONLY dark section on the page)
- Section eyebrow: "Comece agora" (#D4A056)
- Title: "Cole seus textos. Veja como você escreve. Gere com sua assinatura."
  Playfair Display 700, 32px, white
- Description: "Crie seu perfil de voz em 10 minutos. Wizard gratuito."
  Inter 400, 16px, #9CA3AF
- CTA button: white background, #1A2E3C text (inverted from rest of page)
  Same padding and border-radius

### 11. FOOTER
- Background: #1A2E3C (same as final CTA, seamless transition)
- Padding: 64px top, 32px bottom

Layout (desktop): 3 columns

Column 1 (40%):
- "Cultiv" wordmark, Playfair Display 700, 20px, white
- Description: Inter 400, 14px, #9CA3AF, line-height 1.65, margin-top: 16px

Column 2 (30%):
- 4 links, Inter 400, 14px, #9CA3AF
  Hover: white
  Vertical stack with 12px gap

Column 3 (30%):
- "Compartilhe com o criador que ainda copia e cola do ChatGPT."
  Inter 400, 14px, #9CA3AF

Bottom bar:
- Divider: 1px solid rgba(255,255,255,0.1)
- "Feito com métricas e IA" — Inter 400, 13px, #6B7280, centered

---

RESPONSIVE:
- Desktop: as described
- Tablet (< 1024px): 2-column pricing becomes scrollable row, comparison table becomes stacked
- Mobile (< 768px): everything single column, nav becomes hamburger, hero headline 32px, section padding 64px

ANIMATIONS (minimal):
- Sections: fade-in-up on scroll, 400ms ease-out, 20ms delay
- Demo metrics: stagger reveal, 100ms between cards
- No parallax, no floating, no morphing, no elastic, no spring physics

---

BRAND ELEMENTS (deliberately minimal):
- No logo icon in the page body (wordmark only in nav and footer)
- No decorative illustrations anywhere
- No botanical elements, no map imagery, no compass icons
- The design IS the typography and spacing — nothing else needed
```

---

## Prompt Curto (v0)

```
Landing page for "Cultiv", AI writing tool. NO gradients, NO glassmorphism, NO stock photos, NO generic SaaS templates.

Paper-like feel: cream background #FFFBF5, deep blue text #1A2E3C, terracotta CTAs #C75B39.

Typography IS the design: Playfair Display 700 for headlines (48px), Inter 400 for body (16px), JetBrains Mono for metrics (28px). Generous whitespace, 5px border-radius, dotted borders on cards.

Sections: Nav (wordmark + 4 links + CTA) → Hero (centered headline + subheadline + single CTA) → Demo (textarea left, 6 metric cards right, comparison below) → Problem (3 text-only cards) → Comparison table (4 columns) → How it works (5 numbered steps) → Pricing (3 cards, no free tier) → Testimonials (3 text-only cards, no photos) → FAQ (accordion) → Final CTA (dark section) → Footer (dark, minimal).

Key constraints: No icons, no illustrations, no images in cards. Typography and spacing only. No hover scale/glow effects. One accent color per viewport. Quiet, editorial, confident.
```

---

## Prompt OG Image

```
OG image 1200x630 for Cultiv. NO gradients, NO glassmorphism.

Cream background #FFFBF5. Two cards side by side with 1px border at 15% opacity:

Left card: "ChatGPT genérico" label in gray, quote "Em um mundo cada vez mais acelerado..." in gray italic, "✗ Genérico" badge.

Right card: "Com sua voz" label in terracotta, quote "Parei de correr atrás de toda tendência da semana." in deep blue italic, "✓ Sua assinatura" badge.

Below: horizontal divider line (1px, 15% opacity).

Below divider: Headline "Seu texto ainda soa como ChatGPT?" in Playfair Display 700, deep blue.

Below: "Cole 5 textos. Veja suas métricas. Gere como você." in Inter 400, gray.

Bottom left: "Cultiv" wordmark only (no icon).

Flat colors only. No shadows. No decorative elements. Typography and spacing.
```
