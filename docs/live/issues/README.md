# Issues — Cultiv Marketing Surface

## Phase 1 — Initial launch

Vertical slices for [PRD phase 1](../prd/cultiv-marketing-surface-phase-1.md).

| # | Issue | Type | Status | Blocked by |
|---|-------|------|--------|------------|
| 01 | [Design System and web scaffold](./01-design-system-and-web-scaffold.md) | AFK | done | — |
| 02 | [Marketing shell and bilingual routes](./02-marketing-shell-bilingual-routes.md) | AFK | done | 01 |
| 03 | [Editorial sections and i18n](./03-editorial-sections-and-i18n.md) | AFK | done | 02 |
| 04 | [Showcase Samples catalog](./04-showcase-samples-catalog.md) | HITL | done | 02 |
| 05 | [Legal pages](./05-legal-pages.md) | AFK | done | 02 |
| 06 | [Waitlist Loops end-to-end](./06-waitlist-loops-end-to-end.md) | AFK | done | 03, 05 |
| 07 | [Motion system and accessibility](./07-motion-system-and-accessibility.md) | AFK | done | 03, 04 |
| 08 | [SEO quality and Vercel deploy](./08-seo-quality-and-vercel-deploy.md) | HITL | done | 06, 07 |

**Suggested order:** 01 → 02 → (03, 04, 05 in parallel) → 06 → 07 → 08

---

## Phase 1.2 — Product Showcase restructure

Vertical slices for [PRD phase 1.2](../prd/cultiv-product-showcase-restructure.md) · [parent issue](../prd/issue-product-showcase-restructure.md) · [plan](../plan/product-showcase-restructure-implementation-plan.md)

| # | Issue | Type | Status | Blocked by |
|---|-------|------|--------|------------|
| 09 | [ButtonLink and header waitlist CTA](./09-buttonlink-and-header-cta.md) | AFK | done | — |
| 10 | [Message catalogs, SEO, and GEO](./10-message-catalogs-seo-geo.md) | AFK | done | — |
| 11 | [Marketing Hero and page shell reorder](./11-hero-and-page-shell.md) | AFK | done | 09, 10 |
| 12 | [Problem section and typographic scenes](./12-problem-section-and-scenes.md) | AFK | done | 10, 11 |
| 13 | [Solution Breath section](./13-solution-breath-section.md) | AFK | done | 10, 11 |
| 14 | [Use cases, product flow, and social proof](./14-use-cases-flow-and-social-proof.md) | AFK | done | 10, 11 |
| 15 | [Differentiator chapters and LinkedIn teaser](./15-differentiator-chapters-and-teaser.md) | AFK | done | 10, 11 |
| 16 | [Legacy removal and quality gate](./16-legacy-removal-and-quality-gate.md) | AFK | done | 12, 13, 14, 15 |

**Suggested order:** (09, 10 in parallel) → 11 → (12, 13, 14, 15 in parallel) → 16

---

## Text Generation — Lexical Quality

Vertical slices for [PRD](../prd/text-generation-lexical-quality.md) · [ADR 0001](../../adr/0001-generation-domain-and-lexical-quality.md) · [plan](../plan/text-generation-lexical-quality-implementation-plan.md) · [tracker](../plan/text-generation-lexical-quality-tracker.md)

| # | Issue | Type | Status | Blocked by |
|---|-------|------|--------|------------|
| 17 | [Unified OutputWordTarget](./17-unified-output-word-target.md) | AFK | ready-for-agent | — |
| 18 | [Generation domain classifier](./18-generation-domain-classifier.md) | AFK | ready-for-agent | 17 |
| 19 | [PromptPolicy and domain prompts](./19-prompt-policy-domain-prompts.md) | AFK | ready-for-agent | 18 |
| 20 | [Domain-filtered lexicon and voice](./20-domain-filtered-lexicon-voice.md) | AFK | ready-for-agent | 18 |
| 21 | [Step-scoped context and adapter](./21-step-scoped-context-adapter.md) | AFK | ready-for-agent | 19 |
| 22 | [Format condensation pipeline steps](./22-linkedin-tighten-pipeline-step.md) | AFK | ready-for-agent | 17, 19 |
| 23 | [Lexical critic and fidelity](./23-lexical-critic-fidelity.md) | AFK | ready-for-agent | 17, 18 |
| 24 | [Lexical release gate and selection](./24-lexical-release-gate-selection.md) | AFK | ready-for-agent | 23 |
| 25 | [Lexical regression corpus](./25-lexical-regression-corpus.md) | AFK | ready-for-agent | 17 |
| 26 | [Showcase and voice fixtures audit](./26-showcase-voice-fixtures-audit.md) | HITL | ready-for-agent | 24 |

**Suggested order:** 17 → 18 → (19 ∥ 20) → 21 → 22 → 23 → 24 → 26 · 25 parallel from 17

---

## Authenticated Workspace — Web v2

Vertical slices for [PRD](../prd/cultiv-authenticated-workspace-web-v2.md) · [parent issue](../prd/issue-authenticated-workspace-web-v2.md) · [plan](../plan/phase-2-implementation-plan.md) · [screen specs](../plan/web-v2-screen-specs.md)

| # | Issue | Type | Status | Blocked by |
|---|-------|------|--------|------------|
| 27 | [Auth and SDK foundation](./27-auth-and-sdk-foundation.md) | HITL | ready-for-agent | — |
| 28 | [App shell and active execution shell](./28-app-shell-and-active-execution-shell.md) | AFK | ready-for-agent | 27 |
| 29 | [Generation screen end-to-end](./29-generation-screen-end-to-end.md) | AFK | ready-for-agent | 28 |
| 30 | [Execution observation and drawer](./30-execution-observation-and-drawer.md) | AFK | ready-for-agent | 29 |
| 31 | [Execution history and detail](./31-execution-history-and-detail.md) | AFK | ready-for-agent | 30 |
| 32 | [Voice dashboard and example composer](./32-voice-dashboard-and-example-composer.md) | AFK | ready-for-agent | 28 |
| 33 | [Onboarding and account settings](./33-onboarding-and-account-settings.md) | AFK | ready-for-agent | 29, 32 |
| 34 | [App i18n governance and QA gate](./34-app-i18n-governance-and-qa-gate.md) | AFK | ready-for-agent | 30, 31, 33 |

**Suggested order:** 27 → 28 → 29 → 30 → 31 · (32 parallel after 28) → 33 → 34

---

## Plan tier quality modes

Vertical slices for [PRD](../prd/plan-tier-quality-modes.md) · [ADR 0002](../../adr/0002-plan-tier-quality-modes-and-default-free-subscription.md) · [parent issue](../prd/issue-plan-tier-quality-modes.md) · [plan](../plan/plan-tier-quality-modes-implementation-plan.md)

| # | Issue | Type | Status | Blocked by |
|---|-------|------|--------|------------|
| 35 | [Default free subscription on JIT](./35-default-free-subscription-jit.md) | AFK | done | — |
| 36 | [Quality mode tier entitlements](./36-quality-mode-tier-entitlements.md) | AFK | done | 35 |
| 37 | [Content catalog availability model](./37-content-catalog-availability-model.md) | AFK | done | 35 |
| 38 | [Generation screen commercial UX](./38-generation-screen-commercial-ux.md) | AFK | done | 36, 37 |

**Suggested order:** 35 → (36 ∥ 37) → 38

---

## Workspace Visual Refresh

Vertical slices for [PRD](../prd/workspace-visual-refresh.md) · [ADR 0003](../../adr/0003-workspace-visual-refresh.md) · [parent issue](../prd/issue-workspace-visual-refresh.md) · [plan](../plan/workspace-visual-refresh-implementation-plan.md)

| # | Issue | Type | Status | Blocked by |
|---|-------|------|--------|------------|
| 39 | [Workspace tokens and motion foundation](./39-workspace-tokens-and-motion-foundation.md) | AFK | done | — |
| 40 | [Workspace UI primitives](./40-workspace-ui-primitives.md) | AFK | done | 39 |
| 41 | [App shell chrome refresh](./41-app-shell-chrome-refresh.md) | AFK | done | 39 |
| 42 | [Generation screen visual refresh](./42-generation-screen-visual-refresh.md) | AFK | done | 40 |
| 43 | [Active execution drawer reading surface](./43-active-execution-drawer-reading-surface.md) | AFK | done | 40 |
| 44 | [Voice dashboard confidence presentation](./44-voice-dashboard-confidence-presentation.md) | AFK | done | 40 |
| 45 | [Execution history and result reading polish](./45-execution-history-and-result-reading-polish.md) | AFK | done | 40 |
| 46 | [Onboarding and settings visual pass](./46-onboarding-and-settings-visual-pass.md) | AFK | done | 40 |
| 47 | [Workspace visual QA gate](./47-workspace-visual-qa-gate.md) | HITL | ready-for-agent | 41–46 |

**Suggested order:** 39 → (40 ∥ 41) → (42, 43, 44, 45 in parallel) → 46 → 47

---

## Durable Async Runtime

Vertical slices for [PRD](../prd/durable-async-runtime.md) · [ADR 0004](../../adr/0004-durable-async-runtime-zero-in-process-state.md) · [parent issue](../prd/issue-durable-async-runtime.md) · [plan](../plan/durable-async-runtime-implementation-plan.md)

| # | Issue | Type | Status | Blocked by |
|---|-------|------|--------|------------|
| 48 | [Durable database and Redis bootstrap](./48-durable-database-redis-bootstrap.md) | AFK | ready-for-agent | — |
| 49 | [Billing PostgreSQL persistence](./49-billing-postgresql-persistence.md) | AFK | ready-for-agent | 48 |
| 50 | [Job runtime PostgreSQL source of truth](./50-job-runtime-postgresql-source-of-truth.md) | AFK | ready-for-agent | 48 |
| 51 | [Transactional outbox and relay](./51-transactional-outbox-and-relay.md) | AFK | ready-for-agent | 50 |
| 52 | [Redis queue and worker process](./52-redis-queue-and-worker-process.md) | AFK | ready-for-agent | 51 |
| 53 | [Atomic async execution enqueue](./53-atomic-async-execution-enqueue.md) | AFK | ready-for-agent | 49, 51 |
| 54 | [SSE Redis fan-out](./54-sse-redis-fan-out.md) | AFK | ready-for-agent | 52 |
| 55 | [Durable limits and execution idempotency](./55-durable-limits-and-execution-idempotency.md) | AFK | ready-for-agent | 48 |
| 56 | [Web waitlist durable rate limiting](./56-web-waitlist-durable-rate-limiting.md) | AFK | ready-for-agent | 55 |
| 57 | [Restart and multi-replica verification gate](./57-restart-multi-replica-verification-gate.md) | HITL | ready-for-agent | 53, 54, 55, 56 |

**Suggested order:** 48 → (49 ∥ 50) → 51 → 52 → 53 → 54 → 55 → 56 → 57

---

## Integrator + Cloudflare Deploy

Vertical slices for [PRD](../prd/integrator-cloudflare-deploy.md) · [ADR 0005](../../adr/0005-integrator-cloudflare-deploy.md) · [parent issue](../prd/issue-integrator-cloudflare-deploy.md) · [plan](../plan/integrator-cloudflare-deploy-implementation-plan.md)

| # | Issue | Type | Status | Blocked by |
|---|-------|------|--------|------------|
| 58 | [VPS provisioning and home region](./58-oracle-vm-provisioning.md) | AFK | ready-for-agent | — |
| 59 | [Cloudflare Tunnel and WAF setup](./59-cloudflare-tunnel-waf.md) | AFK | ready-for-agent | — |
| 60 | [VM bootstrap and Docker Compose](./60-vm-bootstrap-docker.md) | AFK | ready-for-agent | 58 |
| 61 | [Backend deployment pipeline](./61-backend-deployment-pipeline.md) | AFK | ready-for-agent | 60 |
| 62 | [Monitoring and alerting](./62-monitoring-alerting.md) | AFK | ready-for-agent | 61 |
| 63 | [Backup and disaster recovery](./63-backup-recovery.md) | AFK | ready-for-agent | 60 |
| 64 | [Graceful shutdown implementation](./64-graceful-shutdown.md) | AFK | ready-for-agent | 61 |
| 65 | [Deploy verification and go-live](./65-oracle-deploy-verification.md) | HITL | ready-for-agent | 62, 63, 64 |

**Suggested order:** 58 → 59 → 60 → 61 → 62 → 63 → 64 → 65

---

## Author Reasoning Signature

Vertical slices for [PRD](../prd/author-reasoning-signature.md) · [ADR 0006](../../adr/0006-author-reasoning-signature.md) · [plan](../plan/author-reasoning-signature-implementation-plan.md) · [parent issue](../prd/issue-author-reasoning-signature.md)

| # | Issue | Type | Status | Blocked by |
|---|-------|------|--------|------------|
| 66 | [Reasoning contracts and persistence](./66-reasoning-contracts-persistence.md) | AFK | ready-for-agent | — |
| 67 | [Reasoning extraction on rebuild](./67-reasoning-extraction-rebuild.md) | AFK | ready-for-agent | 66 |
| 68 | [Format-only presets and voice resolution](./68-format-only-presets-voice-resolution.md) | AFK | ready-for-agent | 66, 67 |
| 69 | [Step-scoped reasoning prompts](./69-step-scoped-reasoning-prompts.md) | AFK | ready-for-agent | 68 |
| 70 | [Reasoning drift and critic](./70-reasoning-drift-critic.md) | AFK | ready-for-agent | 68 |
| 71 | [Voice Judge and Groq adapter](./71-voice-judge-groq.md) | AFK | ready-for-agent | 70 |
| 72 | [Voice Reasoning Presentation](./72-voice-reasoning-presentation.md) | AFK | ready-for-agent | 66, 67 |
| 73 | [Reasoning regression and policy](./73-reasoning-regression-policy.md) | HITL | ready-for-agent | 67, 71 |

**Suggested order:** 66 → 67 → 68 → (69 ∥ 70 ∥ 72) → 71 → 73

---

## Argument Development Signature

Vertical slices for [PRD](../prd/argument-development-signature.md) · [ADR 0007](../../adr/0007-argument-development-signature.md) · [plan](../plan/argument-development-signature-implementation-plan.md) · [parent issue](../prd/issue-argument-development-signature.md)

**Prerequisite:** Author Reasoning Signature (issues 66–73).

| # | Issue | Type | Status | Blocked by |
|---|-------|------|--------|------------|
| 74 | [Argument development contracts and persistence](./74-argument-development-contracts-persistence.md) | AFK | ready-for-agent | 66 |
| 75 | [Parallel argument development extraction](./75-parallel-argument-development-extraction.md) | AFK | ready-for-agent | 67, 74 |
| 76 | [Voice signature divergence and reconciliation](./76-voice-signature-divergence-reconciliation.md) | AFK | ready-for-agent | 75 |
| 77 | [Development voice hints and resolution](./77-development-voice-hints-resolution.md) | AFK | ready-for-agent | 74, 76 |
| 78 | [Step-scoped development prompts](./78-step-scoped-development-prompts.md) | AFK | ready-for-agent | 77 |
| 79 | [Argument development drift and critic](./79-argument-development-drift-critic.md) | AFK | ready-for-agent | 77 |
| 80 | [Voice judge development policy](./80-voice-judge-development-policy.md) | AFK | ready-for-agent | 71, 79 |
| 81 | [Voice development presentation](./81-voice-development-presentation.md) | AFK | ready-for-agent | 74, 76 |

**Suggested order:** 74 → 75 → 76 → 77 → (78 ∥ 79 ∥ 81) → 80

---

## Development Traits and Author Confidence

Vertical slices for [PRD](../prd/development-traits-and-author-confidence.md) · [ADR 0008](../../adr/0008-development-traits-and-author-confidence.md) · [plan](../plan/development-traits-implementation-plan.md) · [parent issue](../prd/issue-development-traits.md)

**Prerequisite:** Argument Development Signature (issues 74–81).

| # | Issue | Type | Status | Blocked by |
|---|-------|------|--------|------------|
| 82 | [Development traits contracts and persistence](./82-development-traits-contracts-persistence.md) | AFK | ready-for-agent | 74 |
| 83 | [Development traits extraction and confidence pass](./83-development-traits-extraction-confidence.md) | AFK | ready-for-agent | 75, 82 |
| 84 | [Trait-aware divergence and reconciliation](./84-trait-aware-divergence-reconciliation.md) | AFK | ready-for-agent | 76, 83 |
| 85 | [Author development mirror dashboard](./85-author-development-mirror-dashboard.md) | AFK | ready-for-agent | 81, 82, 84 |
| 86 | [Author trait confirmation and regression](./86-author-trait-confirmation-regression.md) | HITL | ready-for-agent | 85 |
| 87 | [Development traits generation pass-through](./87-development-traits-generation-pass-through.md) | AFK | ready-for-agent | 77, 78, 83, 84 |

**Suggested order:** 82 → 83 → 84 → (85 ∥ 87) → 86
