# Product Showcase — Plano de reestruturação (Fase 1.2)

**Objetivo:** Reestruturar a **Product Showcase** (`apps/web`) com narrativa problema → solução → diferenciais → casos de uso → fluxo do produto, inspirada na gramática visual do Chromia e preservando o material orgânico/editorial do Cultiv.

**Origem:** Sessões grill-with-docs (2026-06) — decisões registradas em [`CONTEXT.md`](../../../CONTEXT.md) (termos *Marketing Problem Angle*, *Solution Breath*, *Differentiator Chapter*, *Marketing Product Flow*, etc.).

**Duração estimada:** 1,5–2 semanas (1 dev)

**Pré-requisitos:**

- Fase 1 da Marketing Surface funcional (TanStack Start, `packages/ui`, Lenis + GSAP, waitlist Loops, i18n pt/en)
- Conteúdo de showcase existente (`apps/web/src/content/showcase/`) como base para teaser LinkedIn
- **Pacote gráfico aprovado** — [`visual-assets/product-showcase-asset-bible.md`](../web-structure/visual-assets/product-showcase-asset-bible.md) (issues 12–15)

---

## 1. Critérios de aceite (Definition of Done)

A reestruturação está completa quando:

- [ ] `/` e `/en` renderizam a nova sequência de seções (ver §2) com copy PT e EN em paridade
- [ ] Header com nav enxuto + CTA `ButtonLink` para `#waitlist` (desktop e mobile)
- [ ] Hero com H1 de valor, subheadline fixa, CTAs primário/secundário, animações acordadas (§8)
- [ ] Seção Problema com 2 **Problem Perspectives** + cenas tipográficas alternadas
- [ ] **Solution Breath** com nota manuscrita, balões interativos e subtítulo fixo
- [ ] **Differentiators** com 4 capítulos scroll (pin desktop, stack + reveal mobile)
- [ ] **Showcase Teaser** (LinkedIn) no capítulo 1 + modal para amostra completa
- [ ] Casos de uso em tríptico editorial (3 **Marketing Use Cases**)
- [ ] **Da voz ao texto** — 5 **Flow Steps** com `BotanicalStem` (simplificado no mobile)
- [ ] Prova social (posicionamento, sem métricas inventadas)
- [ ] FAQ abaixo da waitlist, fora do menu principal
- [ ] SEO title/description/og alt alinhados ao novo hero (§10)
- [ ] `geo` / `llms.txt` / JSON-LD atualizados para o novo posicionamento
- [ ] `prefers-reduced-motion` desativa pin, scale e draw nos capítulos
- [ ] Seções removidas da home: `#about`, `#formats`, showcase horizontal de 3 amostras
- [ ] Lighthouse Performance + Accessibility ≥ 90 (sem regressão relevante)

**Fora de escopo desta entrega:**

- Novas ilustrações fotográficas ou 3D
- Dark mode UI
- Blog/thread como teasers adicionais na dobra principal (podem permanecer só no modal ou fase posterior)
- Auth0, `/app`, client-sdk
- ADR dedicado (decisões já capturadas em `CONTEXT.md`)

---

## 2. Mapa da página

### 2.1 Ordem e âncoras

| Ordem | Seção | ID sugerido | Superfície |
|-------|--------|-------------|------------|
| — | Header | — | `surface` + sticky |
| 1 | Hero | `#hero` | `surface` + `organic-glow-hero` |
| 2 | Problema | `#problema` | `surface` |
| 3 | Solution Breath | `#solucao` | `surface-elevated` |
| 4 | Diferenciais | `#diferenciais` | misto (cap. 1 `showcase`) |
| 5 | Casos de uso | `#casos-de-uso` | `surface` |
| 6 | Da voz ao texto | `#fluxo` | `surface` |
| 7 | Prova social | `#comunidade` | `surface` |
| 8 | Waitlist | `#waitlist` | `invert` |
| 9 | FAQ | `#faq` | `surface` |
| — | Footer | — | `surface` |

### 2.2 Navegação principal

```
Problema · Diferenciais · Casos de uso · Lista
```

Mapeamento: `#problema` · `#diferenciais` · `#casos-de-uso` · `#waitlist`

Remover do menu: `about`, `formats`, `showcase`, `faq`.

---

## 3. Copy de referência (PT)

### Hero

| Campo | Texto |
|-------|-------|
| H1 | Textos que soam como você. |
| Subheadline | Cultiv aprende como você escreve e gera textos que soam pessoais — não genéricos. |
| CTA primário | Entrar na lista |
| CTA secundário | Conhecer o Cultiv → `#problema` |

Sem chip, sem slogan rotativo, sem scroll cue.

### Problema

**Card 1 — Tom genérico**

- Título: *Sua IA soa como todo mundo*
- Corpo: Você pede para escrever "como você", mas o resultado ainda parece template. O tom é correto na superfície — genérico por dentro. Quanto mais você publica, mais sua marca pessoal dilui.

**Card 2 — Prompt frágil**

- Título: *Seu prompt de voz não acompanha você*
- Corpo: Seu jeito de escrever vive num prompt colado no ChatGPT. Troca de formato, nova conversa, outro briefing — e você recomeça do zero. Não há um lugar que aprende e evolui com você.

### Solution Breath

- Nota manuscrita: *Não se constrói uma voz. Cultiva-se.*
- Centro: **Cultiv**
- Subtítulo: *Cultiva a sua voz — em qualquer formato.*
- Balões: **Voz** · **Memória** · **Formato** · **Escala** (micro-copy no hover/toque)

### Diferenciais (capítulos)

| # | Título | Corpo resumido |
|---|--------|----------------|
| 1 | Mesmo briefing, voz diferente | Teaser LinkedIn + modal |
| 2 | Ensine com o que você já escreveu | Exemplos reais ensinam tom e cadência |
| 3 | Briefing guiado, não prompt solto | Formato + objetivo + audiência |
| 4 | Prévia antes de gerar | Créditos e rascunho antes de confirmar |

### Casos de uso

| # | Badge | Título |
|---|-------|--------|
| 1 | LinkedIn | Founder no LinkedIn |
| 2 | Thread | Creator em thread |
| 3 | Blog | Autor de blog |

Nota de rodapé: *+ newsletter e outros formatos no lançamento*

### Da voz ao texto (5 passos)

1. Entre na plataforma  
2. Ensine sua voz  
3. Seu perfil de voz *(1 linha sobre confiança)*  
4. Briefing e prévia  
5. Gere com a sua voz  

### Prova social

- Eyebrow: *Primeiros cultivadores*
- Título: *Quem publica em voz própria já sentiu o problema.*
- Corpo: *Estamos construindo Cultiv com criadores, founders e autores que não abrem mão de soar como eles mesmos.*

### SEO

- Title: `Cultiv — Textos que soam como você`
- Description: alinhada à subheadline + waitlist

---

## 4. Copy de referência (EN)

Paridade estrutural com §3. Principais equivalências:

| PT | EN |
|----|-----|
| Textos que soam como você. | Text that sounds like you. |
| Não se constrói uma voz. Cultiva-se. | You don't build a voice. You cultivate it. |
| Cultiva a sua voz — em qualquer formato. | Cultivate your voice — in any format. |
| Problema / Diferenciais / Casos de uso / Lista | Problem / How it works / Use cases / Waitlist |
| Da voz ao texto | From voice to text *(ou manter título editorial acordado na implementação)* |

---

## 5. Especificação visual por seção

### 5.1 Ritmo de superfície (*Marketing Surface Rhythm*)

- **Papel dominante:** hero, problema, casos, fluxo, prova social, FAQ
- **Elevated:** Solution Breath, capítulos diferenciais 2–4
- **Showcase palette:** capítulo 1 (teaser)
- **Invert:** waitlist apenas

### 5.2 Problema

- Desktop: 2 linhas alternadas texto | cena tipográfica (`GenericOutputStack`, `FragilePromptCollage`)
- Mobile: **cena em cima, texto embaixo**
- Material: `editorial-frame`, `paper-grain`, `FallingLeavesLayer` sparse
- Componentes: `ProblemSection`, `ProblemPerspectiveRow`, cenas em `apps/web/src/visual/scenes/`

### 5.3 Solution Breath

- Layout: constelação orgânica assimétrica em torno de Cultiv
- Balões: `border-subtle`, `surface-elevated`, sem `border-radius`
- Interação: hover (desktop) / tap (mobile) revela micro-copy abaixo do balão
- `min-h-[70vh]` aproximado

### 5.4 Diferenciais (*Differentiator Chapters*)

**Desktop — stack pin vertical (`useDifferentiatorChapters`):**

| Capítulo | Pin scrub | Fundo | Tratamento |
|----------|-----------|-------|------------|
| 1 Showcase | ~120vh | `showcase` | scale 0.92→1, fundo rico, waveform |
| 2 Ensino | ~70vh | `surface` + glow | pin curto, zoom sutil |
| 3 Briefing | ~70vh | `surface-elevated` | idem |
| 4 Confiança | ~70vh | `surface` | idem |

**Mobile:** 4 blocos empilhados + `useSectionReveal` apenas (sem pin).

Cenas visuais por capítulo em `apps/web/src/visual/scenes/` (briefing mock, preview mock, etc.).

### 5.5 Casos de uso

- Tríptico editorial: 3 colunas, borda contínua (padrão `#formats` atual, 3 células)
- Badge de formato em meta; hover título → `text-moss`

### 5.6 Fluxo do produto

- `BotanicalStem` + lista de 5 passos à direita (desktop)
- Stem simplificado no mobile
- Números `[01]`–`[05]` em meta mono

### 5.7 Prova social

- Copy centralizada, `max-w-2xl`, sem card, sem métricas
- `FallingLeavesLayer density="whisper"`

### 5.8 CTAs

- Primário: `ButtonLink variant="primary"` → `#waitlist`
- Secundário hero: link editorial (`tracking-editorial-wide`, moss)
- Header mobile: CTA compacto ao lado do hamburger (recomendado)

---

## 6. Arquitetura de componentes

### 6.1 `packages/ui` (única adição prevista)

```
packages/ui/src/primitives/ButtonLink.tsx   # <a> com variantes do Button
```

Exportar em `primitives/index.ts` e `src/index.ts`.

### 6.2 `apps/web` (novo / alterado)

```
apps/web/src/
├── animations/
│   └── use-differentiator-chapters.ts    # ScrollTrigger pin + scale
├── components/
│   ├── differentiators/
│   │   ├── ChapterPanel.tsx
│   │   └── ShowcaseTeaserPanel.tsx
│   ├── SolutionKeywordBubble.tsx
│   └── ProblemPerspectiveRow.tsx
├── sections/
│   ├── HeroSection.tsx                   # reescrita
│   ├── ProblemSection.tsx                # novo
│   ├── SolutionBreathSection.tsx          # novo
│   ├── DifferentiatorsSection.tsx          # novo
│   ├── UseCasesSection.tsx                 # novo
│   ├── ProductFlowSection.tsx              # novo
│   ├── SocialProofSection.tsx              # novo
│   └── … (FaqSection, WaitlistSection — reorder)
├── visual/scenes/
│   ├── GenericOutputStack.tsx
│   ├── FragilePromptCollage.tsx
│   ├── BriefingScene.tsx                   # cap. 3
│   └── PreviewScene.tsx                    # cap. 4
├── components/BelowFoldSections.tsx        # nova ordem
├── navigation/marketing-nav-items.ts       # novos itens
└── i18n/
    ├── types.ts                            # namespaces novos
    ├── locales/pt.ts
    └── locales/en.ts
```

### 6.3 Remoções / deprecações

| Artefato | Ação |
|----------|------|
| `AboutSection` | Remover da home |
| `FormatsSection` | Remover da home |
| `ShowcaseSection` (carousel horizontal) | Remover da home |
| `PracticesAccordion` | Remover uso (ou manter arquivo se unused) |
| `HeroRotatingSlogan` | Remover do hero |
| Chaves i18n `about`, `formats`, `method` | Remover após migração |
| `geo` references a seções antigas | Atualizar |

---

## 7. i18n — estrutura proposta

Expandir `LocaleMessages`:

```typescript
readonly hero: {
  readonly headline: string;
  readonly subheadline: string;
  readonly ctaPrimary: string;
  readonly ctaSecondary: string;
};
readonly problem: {
  readonly eyebrow: string;
  readonly title: string;
  readonly perspectives: ReadonlyArray<{
    readonly index: string;
    readonly title: string;
    readonly body: string;
  }>;
};
readonly solutionBreath: {
  readonly handwrittenNote: string;
  readonly subtitle: string;
  readonly keywords: ReadonlyArray<{
    readonly word: string;
    readonly microcopy: string;
  }>;
};
readonly differentiators: { /* chapters */ };
readonly useCases: { /* triptych */ };
readonly productFlow: { /* 5 steps */ };
readonly socialProof: { /* positioning */ };
readonly header: {
  readonly nav: {
    readonly problem: string;
    readonly differentiators: string;
    readonly useCases: string;
    readonly waitlist: string;
  };
  readonly ctaWaitlist: string;
};
```

---

## 8. Motion

### Hero

| Elemento | Comportamento |
|----------|---------------|
| H1 | Reveal **palavra a palavra** (adaptar `LetterReveal` ou spans) |
| Sub + CTAs | Stagger fade-up via `useSectionReveal` |
| Árvore | Manter `useDrawStroke` + `useBotanicalUpright` |
| Folhas | Manter `FallingLeavesLayer density="hero"` |
| Reduced motion | Texto estático; sem draw; folhas off |

### Capítulos diferenciais

- Hook: `useDifferentiatorChapters` — `pin`, `scrub`, `scale`, `opacity`, crossfade de fundo
- Reutilizar padrões de `gsap-runtime`, `lenis-provider`, `prefers-reduced-motion`
- `invalidateOnRefresh: true`, `anticipatePin: 1` (como `useHorizontalScrollPin`)

### Demais seções

- `useSectionReveal` + stagger padrão (`MOTION` em `gsap-config.ts`)
- Sem bounce, elastic, parallax agressivo

---

## 9. Showcase — conteúdo

### Teaser na página

- **Content type:** LinkedIn (`linkedin-post` theme)
- **Preview:** 2–3 frases por coluna (genérico vs. voz)
- **Modal:** amostra completa via `ShowcaseSampleDetailModal` existente

### Ajustes de conteúdo

- Reescrever ou truncar `genericOutput` / `voiceOutput` do LinkedIn para teaser
- Blog e thread: manter no repositório de temas; opcional no modal (tabs ou selector) — não na dobra principal
- Revisar `SHOWCASE_CONTENT_PREVIEW_BLOCK_COUNT` se necessário para teaser inline

---

## 10. SEO e GEO

| Artefato | Atualização |
|----------|-------------|
| `i18n.seo.homeTitle` | `Cultiv — Textos que soam como você` / EN equivalent |
| `i18n.seo.homeDescription` | Subheadline + waitlist |
| `i18n.seo.ogImageAlt` | Novo headline |
| `i18n.geo.*` | productDefinition, tagline, summary, keyFacts, llms sections |
| `buildHomeJsonLdGraph` | Revisar strings hardcoded |
| `cultiv-og.svg` | Atualizar texto embutido se aplicável |
| `GeoStructuredData` / `GeoCitationBlock` | Alinhar ou remover citação da seção about removida |

---

## 11. Ordem de implementação

Ordem sugerida para PRs incrementais ou commits lógicos:

### Slice 1 — Fundação (meio dia)

1. `ButtonLink` em `packages/ui` + teste visual rápido
2. Expandir `LocaleMessages` + copy PT/EN completo
3. Atualizar `marketing-nav-items.ts` + `SiteHeader` / `SiteMobileNav` com CTA
4. SEO + geo strings (sem mudar layout ainda)

### Slice 2 — Hero + shell (1 dia)

5. Reescrever `HeroSection` (H1, sub, CTAs, animações)
6. Reordenar `BelowFoldSections` com placeholders para seções novas

### Slice 3 — Seções estáticas (2 dias)

7. `ProblemSection` + cenas tipográficas
8. `SolutionBreathSection` + `SolutionKeywordBubble`
9. `UseCasesSection` (tríptico)
10. `ProductFlowSection` + stem mobile/desktop
11. `SocialProofSection`
12. Mover `FaqSection` abaixo de waitlist

### Slice 4 — Diferenciais + teaser (2–3 dias)

13. `useDifferentiatorChapters` + `ChapterPanel`
14. Capítulo 1: `ShowcaseTeaserPanel` + conteúdo LinkedIn teaser + modal
15. Capítulos 2–4: cenas leves (ensino, briefing, prévia)
16. Fallback mobile + reduced motion

### Slice 5 — Limpeza e verificação (1 dia)

17. Remover seções antigas e código morto
18. Atualizar testes e2e/smoke se existirem
19. Lighthouse, a11y (focus nos balões e capítulos), `hreflang`
20. Atualizar `docs/live/plan/decisions.md` e `progress-log.md` se aplicável

---

## 12. Riscos e mitigações

| Risco | Mitigação |
|-------|-----------|
| Pin + Lenis + header sticky | `anticipatePin`, testes em Safari iOS |
| Scroll longo nos diferenciais | Durações hierárquicas já definidas; cap. 1 maior |
| Balões ilegíveis no mobile | Tap target ≥ 44px; micro-copy abaixo, não tooltip |
| Regressão SEO | Title/description alinhados antes do deploy |
| EN desatualizado | Mesmo PR obriga `pt.ts` + `en.ts` |
| Performance do pin | Lazy load abaixo do hero mantido (`ViewportBelowFoldSections`) |

---

## 13. Verificação manual (test plan)

- [ ] Navegação por âncoras funciona com Lenis
- [ ] CTA header e hero chegam em `#waitlist`
- [ ] Balões revelam micro-copy em hover e toque
- [ ] Capítulos diferenciais: pin suave no desktop; stack no mobile
- [ ] Modal do teaser abre e fecha com foco preso
- [ ] `prefers-reduced-motion: reduce` — sem pin/scale/draw
- [ ] `/en` espelha estrutura e copy
- [ ] FAQ acessível após waitlist, não no menu
- [ ] Lighthouse ≥ 90 performance e a11y

---

## Referências

- Domínio: [`CONTEXT.md`](../../../CONTEXT.md)
- Wireframe original: [`../web-structure/wireframe.md`](../web-structure/wireframe.md)
- Design system: [`../web-structure/design-system.md`](../web-structure/design-system.md)
- Motion: [`../web-structure/system-animation.md`](../web-structure/system-animation.md)
- Decisões rápidas: [`./decisions.md`](./decisions.md)
