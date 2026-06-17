# Cultiv — Web Planning

Planejamento consolidado da implementação web do **Cultiv**, produzido nas sessões grill-with-docs (2026-06).

## Documentos

| Documento | Conteúdo |
|-----------|----------|
| [decisions.md](./decisions.md) | Decisões de arquitetura e domínio (referência rápida) |
| [phase-1-implementation-plan.md](./phase-1-implementation-plan.md) | Plano detalhado — Marketing Surface (validação) |
| [product-showcase-restructure-implementation-plan.md](./product-showcase-restructure-implementation-plan.md) | Plano — reestruturação da Product Showcase (problema → fluxo, Chromia × orgânico) |
| [text-generation-lexical-quality-implementation-plan.md](./text-generation-lexical-quality-implementation-plan.md) | Plano — qualidade lexical e domínio temático na geração de textos |
| [author-reasoning-signature-implementation-plan.md](./author-reasoning-signature-implementation-plan.md) | Plano — raciocínio autoral, extração no rebuild, judge Groq (ADR 0006) |
| [argument-development-signature-implementation-plan.md](./argument-development-signature-implementation-plan.md) | Plano — desenvolvimento argumentativo, extração paralela, reconciliação condicional (ADR 0007) |
| [development-traits-implementation-plan.md](./development-traits-implementation-plan.md) | Plano — Development Traits, Trait Confidence, espelho e confirmação do autor (ADR 0008) |
| [development-traits-regression-baseline.md](./development-traits-regression-baseline.md) | Baseline de regressão — corpus `expectedTraits`, `pnpm eval:development-traits` |
| [text-generation-lexical-quality-tracker.md](./text-generation-lexical-quality-tracker.md) | Tracker — issues 17–26, baseline de métricas, rollout |
| [phase-2-implementation-plan.md](./phase-2-implementation-plan.md) | Plano detalhado — App autenticado (produto) |
| [plan-tier-quality-modes-implementation-plan.md](./plan-tier-quality-modes-implementation-plan.md) | Plano — modos por tier, formatos abertos, assinatura free no JIT (ADR 0002) |
| [workspace-visual-refresh-implementation-plan.md](./workspace-visual-refresh-implementation-plan.md) | Plano — refresh visual do Authenticated Workspace (Jardim de Vidro, ADR 0003) |
| [durable-async-runtime-implementation-plan.md](./durable-async-runtime-implementation-plan.md) | Plano — runtime async durável, PG + Redis + outbox, zero estado em RAM (ADR 0004) |
| [web-v2-platform-structure.md](./web-v2-platform-structure.md) | Estrutura consolidada web v2 — rotas, telas, componentes, SDK (grill 2026-06) |
| [web-v2-screen-specs.md](./web-v2-screen-specs.md) | Especificação por tela — wireframes, estados, campos, i18n, erros |
| [PRD Author Reasoning Signature](../prd/author-reasoning-signature.md) | Fidelidade de raciocínio autoral (ADR 0006) |
| [PRD Argument Development Signature](../prd/argument-development-signature.md) | Fidelidade de desenvolvimento argumentativo (ADR 0007) |
| [PRD Development Traits](../prd/development-traits-and-author-confidence.md) | Traits estruturados e confiança do autor (ADR 0008) |
| ADR [0008](../../adr/0008-development-traits-and-author-confidence.md) | Development Traits e confiança forte do autor |
| [Issues Author Reasoning Signature](../prd/issue-author-reasoning-signature.md) | Vertical slices 66–73 |
| [Issues Argument Development Signature](../prd/issue-argument-development-signature.md) | Vertical slices 74–81 |
| [PRD fase 1](../prd/cultiv-marketing-surface-phase-1.md) | Product Requirements Document — Marketing Surface |
| [PRD Web v2](../prd/cultiv-authenticated-workspace-web-v2.md) | Product Requirements Document — Authenticated Workspace |
| [Issues Web v2](../issues/README.md#authenticated-workspace--web-v2) | Vertical slices 27–34 |
| [PRD plan tier quality modes](../prd/plan-tier-quality-modes.md) | Comercial: modos por tier, assinatura default |
| [Issues plan tier](../issues/README.md#plan-tier-quality-modes) | Vertical slices 35–38 |
| [PRD Workspace Visual Refresh](../prd/workspace-visual-refresh.md) | Refresh visual `/app/*` (ADR 0003) |
| [Issues workspace visual refresh](../issues/README.md#workspace-visual-refresh) | Vertical slices 39–47 |
| [PRD Durable Async Runtime](../prd/durable-async-runtime.md) | Backend: PG SoR, Redis fila/SSE, outbox, workers |
| [Issues durable async runtime](../issues/README.md#durable-async-runtime) | Vertical slices 48–57 |
| [Runbook production go-live](../runbooks/production-go-live.md) | Checklist deploy Vercel + Railway + Auth0 |
| [Issues fase 1](../issues/README.md) | Vertical slices (8 issues) |

## Referências relacionadas

- Domínio: [`CONTEXT.md`](../../../CONTEXT.md)
- Direção criativa: [`../web-structure/design-system-creative-direction.md`](../web-structure/design-system-creative-direction.md)
- Motion: [`../web-structure/system-animation.md`](../web-structure/system-animation.md)
- UX do app (archive): [`../../archive/ui/ux-design.md`](../../archive/ui/ux-design.md)
- Auth: [`../../archive/adr/0021-auth0-owns-signup-and-signin-backend-owns-domain-onboarding.md`](../../archive/adr/0021-auth0-owns-signup-and-signin-backend-owns-domain-onboarding.md)

## Visão geral das fases

```
Fase 1 — Validar demanda
  Marketing Surface (scroll editorial)
  Product Showcase + Waitlist
  Sem auth, sem client-sdk

Fase 1.2 — Reestruturação Product Showcase
  Narrativa problema/solução, capítulos scroll, teaser LinkedIn
  Ver product-showcase-restructure-implementation-plan.md

Fase 1.1 — Polish (opcional pós-lançamento)
  Motion avançado, SEO/Lighthouse, OG images

Fase 2 — Authenticated Workspace (Web v2)
  Auth0 + /app/*
  client-sdk + Effect layers
  Async generation, Voice, History, Settings
  Billing → pós-v2
```

## Escopo por fase

| Capacidade | Fase 1 | Fase 2 |
|------------|--------|--------|
| Product Showcase | ✅ | mantido |
| Waitlist (Loops) | ✅ | mantido |
| i18n pt/en | ✅ | estendido ao app |
| `packages/ui` | tokens + primitivos | + componentes de app |
| TanStack Start | marketing routes | + `/app` protegido |
| Auth0 | ❌ | ✅ |
| `client-sdk` | ❌ | ✅ |
| Geração real | ❌ | ✅ (async-first) |
| Billing app | ❌ | pós-v2 |
