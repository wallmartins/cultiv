---
title: Product Showcase Restructure
doc_type: issue
status: ready-for-agent
domain: marketing-surface
slice_type: AFK
last_updated: 2026-06-11
---

# Product Showcase Restructure (Phase 1.2)

## Parent

- PRD: [`cultiv-product-showcase-restructure.md`](./cultiv-product-showcase-restructure.md)
- Plan: [`../plan/product-showcase-restructure-implementation-plan.md`](../plan/product-showcase-restructure-implementation-plan.md)
- Domain: [`CONTEXT.md`](../../../CONTEXT.md)

## User stories covered

1–40 (full PRD)

## What to build

Reestruturar a **Product Showcase** em `apps/web` com narrativa problema → **Solution Breath** → **Differentiator Chapters** → **Marketing Use Cases** → **Marketing Product Flow** → **Marketing Social Proof** → **Waitlist** → FAQ, em paridade PT/EN.

Esta entrega prova ponta a ponta que:

- o **Marketing Hero** usa headline de valor (*Textos que soam como você.*), subheadline fixa, `ButtonLink` primário para **Waitlist** e link editorial para `#problema` — sem chip, slogan rotativo ou scroll cue
- duas **Problem Perspectives** com cenas tipográficas alternadas (desktop) e visual acima do texto (mobile)
- **Solution Breath** com nota manuscrita, quatro **Solution Keywords** interativos e constelação orgânica
- quatro **Differentiator Chapters** com pin scroll hierárquico no desktop e stack estático no mobile; capítulo 1 é **Showcase Teaser** LinkedIn + modal
- tríptico editorial de três **Marketing Use Cases**
- cinco **Flow Steps** com **BotanicalStem** (simplificado no mobile)
- prova social por posicionamento, sem métricas inventadas
- FAQ abaixo da **Waitlist**, fora do menu principal
- SEO/geo alinhados ao novo hero
- apenas `ButtonLink` novo em `packages/ui`; seções e motion em `apps/web`
- seções legadas removidas: about, formats, showcase horizontal de três amostras

## Acceptance criteria

### Foundation

- [ ] `ButtonLink` exportado de `@my-ai-orchestrator/ui` com variantes `primary`, `ghost`, `invert` e `href` obrigatório.
- [ ] `LocaleMessages` expandido; `pt.ts` e `en.ts` com paridade de chaves para todas as seções novas.
- [ ] Nav principal: Problema · Diferenciais · Casos de uso · Lista (`#problema`, `#diferenciais`, `#casos-de-uso`, `#waitlist`).
- [ ] Header e mobile nav incluem CTA **Waitlist** via `ButtonLink`.

### Hero and page shell

- [ ] Hero: H1, subheadline, CTAs, animação palavra-a-palavra no H1, stagger em sub/CTAs, árvore e folhas mantidas.
- [ ] `BelowFoldSections` reflete a nova ordem de seções e IDs de âncora.

### Static sections

- [ ] `ProblemSection`: `GenericOutputStack` + `FragilePromptCollage`; layout alternado desktop / visual-first mobile.
- [ ] `SolutionBreathSection`: nota, Cultiv, subtítulo, quatro balões com micro-copy em hover/tap.
- [ ] `UseCasesSection`: tríptico 3 colunas com badges de formato.
- [ ] `ProductFlowSection`: 5 passos + stem completo/simplificado.
- [ ] `SocialProofSection`: copy centralizada, sem card ou métricas.
- [ ] `FaqSection` renderiza após `WaitlistSection`.

### Differentiators and showcase

- [ ] `useDifferentiatorChapters` pin/scrub no desktop; fallback reveal-only no mobile e com `prefers-reduced-motion`.
- [ ] Capítulo 1: teaser LinkedIn (preview curto) + modal com amostra completa.
- [ ] Capítulos 2–4: cenas leves (ensino, briefing, prévia) com copy de uma linha.

### SEO, geo, quality

- [ ] `seo.homeTitle`: `Cultiv — Textos que soam como você` / equivalente EN.
- [ ] `seo.homeDescription`, `ogImageAlt`, `geo` e `llms.txt` atualizados.
- [ ] `tests/web/i18n-catalog.test.ts` passa com novas chaves.
- [ ] Testes de teaser/showcase e `geo.test.ts` atualizados conforme necessário.
- [ ] Lighthouse Performance e Accessibility ≥ 90.
- [ ] Código morto removido: `AboutSection`, `FormatsSection`, `ShowcaseSection` carousel, chaves i18n obsoletas.

## Child issues

Vertical slices in `docs/live/issues/` (09–16). See [issues README](../issues/README.md#phase-12--product-showcase-restructure).

| # | Issue |
|---|-------|
| 09 | [ButtonLink and header CTA](../issues/09-buttonlink-and-header-cta.md) |
| 10 | [Message catalogs, SEO, GEO](../issues/10-message-catalogs-seo-geo.md) |
| 11 | [Hero and page shell](../issues/11-hero-and-page-shell.md) |
| 12 | [Problem section](../issues/12-problem-section-and-scenes.md) |
| 13 | [Solution Breath](../issues/13-solution-breath-section.md) |
| 14 | [Use cases, flow, social proof](../issues/14-use-cases-flow-and-social-proof.md) |
| 15 | [Differentiator chapters + teaser](../issues/15-differentiator-chapters-and-teaser.md) |
| 16 | [Legacy removal + QA](../issues/16-legacy-removal-and-quality-gate.md) |

## Blocked by

- Fase 1 Marketing Surface concluída (scaffold, waitlist, motion base, i18n routes)

## Out of scope

Ver PRD § Out of Scope (auth, roadmap com datas, métricas fabricadas, dark mode UI, três amostras em scroll horizontal na home).
