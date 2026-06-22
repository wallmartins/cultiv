---
title: Design System — estrutura e referência
doc_type: reference
status: live
domain: design-system
last_updated: 2026-06-22
---

# Design System — estrutura e referência

O **Cultiv Imprint** é a identidade visual unificada do monorepo — marketing e workspace autenticado compartilham um único pacote **`packages/ui`** (`@my-ai-orchestrator/ui`). A organização segue camadas: tokens → primitives → patterns. Intensidade (`expressive` / `quiet`) é composição no app, não um fork de tokens.

Decisão arquitetural: [ADR 0009 — Cultiv Imprint unified identity](../../adr/0009-cultiv-imprint-identity.md).

Documentação relacionada:

- [Direção criativa](./design-system-creative-direction.md) — filosofia Imprint
- [Especificação completa](../../superpowers/specs/2026-06-22-cultiv-imprint-identity-design.md)
- [Sistema de animação](./system-animation.md) — GSAP, Lenis, scroll reveal (marketing)

---

## Visão geral do pacote

```
packages/ui/
├── src/
│   ├── styles/theme.css      # tokens Imprint (Tailwind v4 @theme)
│   ├── tokens/               # motion, spacing (TypeScript)
│   ├── primitives/           # componentes base
│   ├── patterns/             # composições reutilizáveis
│   ├── lib/cn.ts
│   └── index.ts
```

### Exports

| Export | Caminho | Uso |
|--------|---------|-----|
| Componentes e tokens JS | `@my-ai-orchestrator/ui` | `import { Button, Text, PaperSurface } from "…"` |
| Tema CSS | `@my-ai-orchestrator/ui/styles/theme.css` | `@import` no CSS do app |

---

## 1. Tokens (`theme.css`)

Fonte única via **Tailwind CSS v4** (`@theme`). Sem tokens paralelos marketing vs app.

### Tipografia — três papéis

Regra: *sans conduz, serif imprime, leitura respira.*

| Papel | Token CSS | Fonte | Uso |
|-------|-----------|-------|-----|
| **Condução** | `--font-conducao` / `font-conducao` | Bricolage Grotesque | UI, nav, títulos, labels, botões |
| **Impressão** | `--font-impressao` / `font-impressao` | Fraunces | Taglines, citações de voz, ênfase de marca (escassa) |
| **Leitura** | `--font-leitura` / `font-leitura` | Source Serif 4 | Texto gerado, preview, drawer de execução, showcase |
| **Mono** | `--font-mono` | JetBrains Mono | Meta técnica, créditos, timestamps |

`--font-body` aponta para Condução. Utilitários: `.ui-type-display-xl`, `.ui-type-reading`, `.ui-type-imprint`.

### Cores

| Token | Papel |
|-------|-------|
| `paper` / `paper-elevated` / `paper-pressed` | Fundos de papel |
| `ink` / `ink-muted` / `ink-ghost` | Texto e divisores |
| `pigment-terracotta` | Acento primário, CTA, estados ativos |
| `pigment-indigo` | Acento secundário, links, meta mono |
| `pigment-ochre` | Destaque sutil, progresso, confiança |
| `success` / `warning` / `error` / `info` | Semântica |

Paleta legada (moss, golden, showcase editorial) foi removida.

### Materialidade

| Token / classe | Papel |
|----------------|-------|
| `--shadow-press-edge` / `.press-edge` | Borda embutida simulando impressão |
| `.imprint-grain` | Textura de papel (opacidade via `data-intensity`) |
| `--radius-press` (`2px`) | Botões, inputs, cards |

### Espaçamento e layout

| Token | Valor |
|-------|-------|
| `--spacing-section` | `5.5rem` |
| `--spacing-gutter` | `clamp(1.25rem, 4vw, 2.5rem)` |
| `--site-header-height` | `4.25rem` / `5.25rem` (md+) |

Dark theme: variáveis sob `.dark` preparadas, não productizadas em v1.

### Motion (`tokens/motion.ts`)

`instant`, `fast`, `base`, `slow`, `press`, `reveal`, `hover`, `stagger` — alinhados à narrativa impressão → silêncio. GSAP/Lenis permanecem em `apps/web/src/animations/`.

---

## 2. Modos de intensidade

Atributo raiz `data-intensity` — mesmos tokens, volume visual diferente.

| Aspecto | `expressive` (marketing) | `quiet` (`/app/*`) |
|---------|--------------------------|---------------------|
| Paper grain | 5% | 3% |
| Press edge | cards e seções | cards + inputs + chrome |
| Ink bleed | hero, waitlist | onboarding |
| Fraunces | taglines, pull quotes | rótulos de voz |
| Pigmentos | terracotta + ochre | terracotta em CTA ativo |
| Lenis / scroll reveal | sim | não (mount apenas) |

Implementação: `MarketingLayout` (`expressive`), `AppShell` / `OnboardingLayout` (`quiet`).

---

## 3. Primitives

| Componente | Papel |
|------------|-------|
| **Text** | Escala Condução + variantes `reading` / `imprint` |
| **Button** / **ButtonLink** | `radius-press`, terracotta primário, press edge |
| **Input** | Inset press edge, anel de foco terracotta |
| **Container** / **Grid** | Layout com gutter Imprint |
| **PressMark** | Logo SVG (marca de prensa) |
| **PaperSurface** | `imprint-grain` + `press-edge` |
| **ReadingSurface** | Superfície de leitura imersiva (preview, drawer) |
| **InkBleed** | Gradiente decorativo de pigmento (marketing/onboarding) |

### Text — variantes principais

| Variante | Papel |
|----------|-------|
| `display-xl`, `display`, `heading-lg`, `heading`, `h1`–`h3` | Condução |
| `body`, `body-lg`, `caption`, `label`, `meta`, `mono` | UI e meta |
| `reading` | Source Serif 4 — conteúdo gerado |
| `imprint` | Fraunces — ênfase escassa |

Aliases legados (`chapter`, `handwritten`) mapeiam para a escala Imprint.

---

## 4. Patterns

| Pattern | Uso |
|---------|-----|
| **SectionHeader** | Eyebrow + título display + descrição |
| **Accordion** | FAQ numerado |
| **ComparisonCard** | Genérico vs voz (showcase) |
| **Label** | Rótulo indexado |

---

## 5. Integração com `apps/web`

```css
/* apps/web/src/styles/app.css */
@import "tailwindcss" source("../");
@import "@my-ai-orchestrator/ui/styles/theme.css";
```

Composições por superfície:

```
apps/web/src/
├── marketing/     # expressive — hero, showcase, waitlist
├── app/           # quiet — shell, geração, voz, histórico
├── animations/    # GSAP + Lenis (marketing)
└── styles/app.css # overrides mínimos de intensidade
```

Governança: `tests/governance/imprint-visual-governance.test.ts` bloqueia padrões legados (Playfair, Caveat, moss/golden, botânicos).

---

## 6. Princípios (três movimentos)

1. **Modernismo** — funcional, preciso; grid antes de curva.
2. **Arts and Crafts** — textura e autenticidade (grain, press edge).
3. **Minimalismo** — texto protagonista em superfícies de leitura.

| Princípio | Implementação |
|-----------|---------------|
| Texto vence | `ReadingSurface` sem cromia em preview/execução |
| Textura, não decoração | grain e press edge como material |
| Uma gramática, dois volumes | tokens únicos + `data-intensity` |
| Cor com intenção | neutros default; pigmentos com propósito |

---

## 7. Referência rápida

```typescript
import {
  Text,
  Button,
  Container,
  Input,
  Grid,
  PressMark,
  PaperSurface,
  ReadingSurface,
  InkBleed,
  SectionHeader,
  Accordion,
  ComparisonCard,
  Label,
  cn,
  motionTokens,
  spacingTokens
} from "@my-ai-orchestrator/ui";
```

```css
@import "@my-ai-orchestrator/ui/styles/theme.css";
```
