---
title: Design System — estrutura e referência
doc_type: reference
status: live
domain: design-system
last_updated: 2026-06-23
---

# Design System — estrutura e referência

O **Cultiv Cartography** é a identidade visual unificada do monorepo — marketing e workspace autenticado compartilham um único pacote **`packages/ui`** (`@my-ai-orchestrator/ui`). A organização segue camadas: tokens → primitives → patterns. Volume de superfície (`marketing` / `workspace`) é composição no app, não um fork de tokens.

Decisão arquitetural: [ADR 0010 — Cultiv Cartography unified identity](../../adr/0010-cultiv-cartography-identity.md).

Documentação relacionada:

- [Direção criativa](./design-system-creative-direction.md) — filosofia Cartography
- [Especificação completa](../../superpowers/specs/2026-06-23-cultiv-cartography-redesign-design.md)
- [Sistema de animação](./system-animation.md) — GSAP, Lenis, scroll reveal (marketing)

---

## Visão geral do pacote

```
packages/ui/
├── src/
│   ├── styles/theme.css      # tokens Cartography (Tailwind v4 @theme)
│   ├── tokens/               # motion, spacing (TypeScript)
│   ├── primitives/           # componentes base
│   ├── patterns/             # composições reutilizáveis
│   ├── lib/cn.ts
│   └── index.ts
```

### Exports

| Export | Caminho | Uso |
|--------|---------|-----|
| Componentes e tokens JS | `@my-ai-orchestrator/ui` | `import { Button, Text, ExpeditionCard } from "…"` |
| Tema CSS | `@my-ai-orchestrator/ui/styles/theme.css` | `@import` no CSS do app |

---

## 1. Tokens (`theme.css`)

Fonte única via **Tailwind CSS v4** (`@theme`). Sem tokens paralelos marketing vs app.

### Tipografia — quatro papéis

Regra: *Playfair conduz autoridade, Inter conduz interface, Caveat anota margens, mono marca coordenadas.*

| Papel | Token CSS | Fonte | Uso |
|-------|-----------|-------|-----|
| **Autoridade** | `--font-autoridade` / `font-autoridade` | Playfair Display | Títulos display, logbook |
| **Condução** | `--font-conducao` / `font-conducao` | Inter | UI, nav, labels, botões |
| **Margem** | `--font-margem` / `font-margem` | Caveat | Anotações escassas |
| **Coordenadas** | `--font-coordenadas` / `font-mono` | JetBrains Mono | Meta técnica, créditos, timestamps |

`--font-body` aponta para Condução. Utilitários: `.ui-type-display-xl`, `.ui-type-logbook`, `.ui-type-mono`.

### Cores

| Token | Papel |
|-------|-------|
| `cream` / `off-white` | Fundos de atlas |
| `ink` / `ink-muted` / `ink-ghost` | Texto e divisores |
| `terracotta` | Acento primário, CTA, estados ativos |
| `deep-blue` | Acento estrutural, links, meta mono |
| `ochre` | Destaque sutil, progresso, confiança |
| `success` / `warning` / `error` / `info` | Semântica |

Aliases `paper`, `pigment-*` e nomes pt-BR (`creme`, `terracota`, …) mapeiam para os tokens cartográficos.

### Materialidade

| Token / classe | Papel |
|----------------|-------|
| `--shadow-cartography` / `.shadow-cartography` | Sombra offset editorial |
| `.cartography-grain` | Textura de papel (opacidade via `data-surface`) |
| `.border-dotted-cartography` | Borda pontilhada de carta |
| `--radius-cartography` (`5px`) | Botões, inputs, cards |

### Espaçamento e layout

| Token | Valor |
|-------|-------|
| `--spacing-section` | `5.5rem` |
| `--spacing-gutter` | `clamp(1.25rem, 4vw, 2.5rem)` |
| `--site-header-height` | `4.25rem` / `5.25rem` (md+) |

Dark theme: variáveis sob `.dark` preparadas, não productizadas em v1.

### Motion (`tokens/motion.ts`)

`instant`, `fast`, `base`, `slow`, `press`, `reveal`, `hover`, `stagger` — alinhados à narrativa expedição → silêncio. GSAP/Lenis permanecem em `apps/web/src/animations/`.

---

## 2. Modos de superfície

Atributo raiz `data-surface` — mesmos tokens, volume visual diferente.

| Aspecto | `marketing` | `workspace` (`/app/*`) |
|---------|-------------|------------------------|
| Paper grain | 6% | 3% |
| Parallax de textura | sim | não |
| Playfair display | hero, seções | rótulos de voz |
| Pigmentos | terracotta + ochre | terracotta em CTA ativo |
| Lenis / scroll reveal | sim | não (mount apenas) |

Implementação: `MarketingLayout` (`data-surface="marketing"`), `AppShell` / `OnboardingLayout` (`data-surface="workspace"`).

---

## 3. Primitives

| Componente | Papel |
|------------|-------|
| **Text** | Escala Condução + variantes `logbook` / `margem` |
| **Button** / **ButtonLink** | `radius-cartography`, terracotta primário, shadow cartography |
| **Input** | Borda pontilhada, anel de foco terracotta |
| **Container** / **Grid** | Layout com gutter cartográfico |
| **CompassMark** | Logo SVG (marca bússola) |
| **CartographySurface** | `cartography-grain` + fundo cream |
| **LogbookProse** | Superfície de leitura imersiva (preview, drawer) |
| **ExpeditionCard** | Card cream + borda pontilhada + terracotta quando selecionado |
| **RouteLine** / **CoordinateLabel** | Linha de rota e rótulos §01 · … |

### Text — variantes principais

| Variante | Papel |
|----------|-------|
| `display-hero`, `display-xl`, `display`, `heading-lg`, `heading`, `h1`–`h3` | Autoridade (Playfair) |
| `body`, `body-lg`, `caption`, `label`, `meta`, `mono` | UI e meta |
| `logbook` | Playfair itálico — conteúdo gerado |
| `margem` | Caveat — anotações escassas |

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
├── marketing/     # marketing — hero, showcase, waitlist
├── app/           # workspace — shell, geração, voz, histórico
├── animations/    # GSAP + Lenis (marketing)
└── styles/app.css # overrides mínimos de superfície
```

Governança: `tests/governance/cartography-visual-governance.test.ts` bloqueia padrões Imprint legados (PressMark, Bricolage, Fraunces, Source Serif, botânicos, `imprint-grain`, `press-edge`, `data-intensity`).

---

## 6. Princípios (três movimentos)

1. **Modernismo** — funcional, preciso; grid antes de curva.
2. **Arts and Crafts** — textura e autenticidade (grain, bordas pontilhadas).
3. **Minimalismo** — texto protagonista em superfícies de leitura.

| Princípio | Implementação |
|-----------|---------------|
| Texto vence | `LogbookProse` sem cromia em preview/execução |
| Textura, não decoração | grain e bordas como material |
| Uma gramática, dois volumes | tokens únicos + `data-surface` |
| Cor com intenção | neutros default; pigmentos com propósito |
| Reconhecível isolado | cream + borda pontilhada + Playfair + terracotta |

---

## 7. Referência rápida

```typescript
import {
  Text,
  Button,
  Container,
  Input,
  Grid,
  CompassMark,
  CartographySurface,
  ExpeditionCard,
  LogbookProse,
  RouteLine,
  CoordinateLabel,
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
