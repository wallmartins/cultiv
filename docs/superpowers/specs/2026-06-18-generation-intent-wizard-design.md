---
title: Generation Intent & Wizard — Phase 1
doc_type: design
status: approved
domain: product
last_updated: 2026-06-18
phase: 1
parent_roadmap: content-formats-and-pricing-phased-roadmap
---

# Generation Intent & Wizard — Phase 1

## Summary

Replace the user-facing **Content Type** picker with a **goal-first wizard** (`intent` + `scope`) while keeping existing pipelines as a **temporary internal execution layer**. Establish the public product contract for horizontal audiences without cementing the six legacy format IDs in the API or UI.

This is **Phase 1** of the approved roadmap:

1. **Phase 1 (this spec):** Intent + scope + wizard + temporary resolver → legacy pipelines  
2. **Phase 2:** Meta-pipelines parametrized + hybrid pricing finalized (`profile × lengthTier × mode`)  
3. **Phase 3:** Dynamic step planner (post-user telemetry)

**Alpha context:** production deploy exists; no external customers. Breaking changes to the public generation contract are acceptable. Web is the only consumer that must migrate in Phase 1.

## Problem

Current formats (`linkedin-post`, `architecture-post`, etc.) were designed for the founder-author workflow. The UI already rebrands labels, but:

- The **API and Generation Screen** still center on `contentType`.
- Briefings and pipelines are **1:1 with six fixed boxes**.
- Hybrid pricing calibrated per legacy `contentType` will be **replaced in Phase 2** — Phase 1 must not deepen product dependence on those IDs.

A horizontal product needs users to choose **what they want to achieve** and **how big the piece is**, not which internal pipeline name fits.

## Goals

1. Introduce `GenerationIntent` and `GenerationScope` as the **primary user-facing generation parameters**.
2. Replace the format selector on the Generation Screen with a **three-step wizard**.
3. Add `IntentResolver` in the backend product layer: `(intent, scope) → legacy contentType + runtime hints`.
4. Keep execution, voice, quality modes, and billing engine **unchanged** in Phase 1.
5. Mark resolver → legacy mapping as **explicitly temporary** (`@phase1-legacy`).
6. Preserve an **Advanced** path to legacy format IDs for internal testing only (hidden by default).

## Non-Goals (Phase 1)

- Meta-pipelines or dynamic step planning (Phases 2–3).
- Final hybrid quota pricing in the UI (Phase 2). Phase 1 may keep interim credit copy or minimal quota estimates.
- Removing `contentType` from `catalog.json` or database.
- Marketing pricing page updates.
- Enterprise / team features.

## User Experience

### Wizard flow

```
Step 1 — Objective     Step 2 — Scope           Step 3 — Compose
─────────────────      ───────────────          ─────────────────
"What do you want      Length: Curto | Médio |   Dynamic briefing
 to do?"                Longo                     Quality mode
                        Channel (optional)        Preview → Generate
```

### Step 1 — Objectives (v1 catalog)

| Intent ID | Label (pt) | Label (en) | Description |
|-----------|------------|----------|-------------|
| `share-idea` | Compartilhar uma ideia | Share an idea | Opinion, lesson, or takeaway for an audience |
| `explain-deeply` | Explicar com profundidade | Explain in depth | Teach or unpack a topic with structure |
| `engage-audience` | Engajar a audiência | Engage your audience | Spark reaction, question, or discussion |
| `tell-story` | Contar uma história | Tell a story | Narrative across one or more beats |
| `update-subscribers` | Atualizar assinantes | Update subscribers | Recurring edition / newsletter-style update |

**More options** (collapsed by default):

| Intent ID | Label (pt) | Notes |
|-----------|------------|-------|
| `document-decision` | Registrar uma decisão | Maps to legacy architecture workflow; technical but available |

Five primary cards keep cognitive load low; `document-decision` avoids losing ADR-style power users.

### Step 2 — Scope

**Length tier** (required):

| Tier ID | Label (pt) | Typical word range (internal) | Default suggestion |
|---------|------------|-------------------------------|--------------------|
| `short` | Curto | 150–400 | Default for `share-idea`, `engage-audience` |
| `medium` | Médio | 400–1,200 | Default for `tell-story`, `document-decision` |
| `long` | Longo | 1,200–3,500 | Default for `explain-deeply`, `update-subscribers` |

Wizard pre-selects tier from intent; user may override.

**Channel** (optional, collapsed):

| Channel ID | Label (pt) |
|------------|------------|
| `unspecified` | Ainda não sei |
| `professional-network` | Rede profissional |
| `blog` | Blog ou site |
| `email` | E-mail / newsletter |
| `social` | Rede social |

Channel influences Format Expression Profile selection in Phase 1 only where mapping exists; otherwise ignored without error.

### Step 3 — Compose

- Dynamic briefing fields from `intent` (not from legacy `contentType` id in the UI).
- Language, imported context, quality mode — same as today.
- Preview sidebar: interim messaging OK (credits or rough quota estimate). **Final quota UX deferred to Phase 2.**
- Educational “ver detalhes” on usage (per hybrid pricing spec) — no internal credit math.

### Advanced mode (dev / alpha only)

- Feature flag `generation.legacy_format_picker` (default `false`).
- When enabled: show legacy six-format selector for comparison testing.
- Not exposed in production marketing builds.

## Architecture

```
apps/web — Generation Wizard
    │  intent + scope + briefing
    ▼
packages/contracts — GenerationIntentRequest (public)
    ▼
apps/backend/product/generation/intent-resolver.ts   [@phase1-legacy]
    │  → contentTypeId + lengthHint + channelHint
    ▼
Existing path unchanged:
  aiPolicy.resolveExecutionSnapshot(contentType, …)
  execution pipeline (catalog.json)
  billing reserve/capture (legacy creditPrice)
```

### Design rules

1. **Product speaks intent; execution speaks pipeline.** No new user-facing copy references `linkedin-post`, `validation-post`, etc.
2. **Resolver is a adapter, not the domain model.** Phase 2 deletes most mapping rows in favor of `generationProfile`.
3. **Preview and execute must resolve the same way** — single `resolveGenerationIntent()` used by preview and public-generation.

## Contracts

### New types (`packages/contracts/src/generation-intent.ts`)

```typescript
export const GenerationIntentSchema = Schema.Literal(
  "share-idea",
  "explain-deeply",
  "engage-audience",
  "tell-story",
  "update-subscribers",
  "document-decision"
);

export const GenerationLengthTierSchema = Schema.Literal("short", "medium", "long");

export const GenerationChannelSchema = Schema.Literal(
  "unspecified",
  "professional-network",
  "blog",
  "email",
  "social"
);

export const GenerationScopeSchema = Schema.Struct({
  lengthTier: GenerationLengthTierSchema,
  channel: Schema.optional(GenerationChannelSchema)
});

export const GenerationIntentRequestSchema = Schema.Struct({
  intent: GenerationIntentSchema,
  scope: GenerationScopeSchema,
  briefing: /* same union as today */,
  importedContext: Schema.optional(Schema.String),
  language: Schema.optional(Schema.String),
  qualityMode: Schema.optional(QualityModeSchema)
});
```

### API changes

| Endpoint | Phase 1 behavior |
|----------|------------------|
| `POST /api/generation-preview` | Accept `intent` + `scope` **or** legacy `contentType` (deprecated). Prefer intent in web. |
| `POST /me/executions` | Same |
| `GET /me/content-types` | **Deprecated** for web; kept for alpha SDK/tests. Returns items with `deprecated: true` in view extension or documented as legacy. |

`MeExecutionRequest` gains optional `intent` + `scope`; when present, `contentType` is ignored. When absent, legacy path for transitional tests.

`GenerationPreviewResponse.options.contentTypes` may be removed from web consumption; backend can still return for flag-gated advanced mode.

### Briefing schemas

New module: `apps/backend/src/product/catalog/intent-briefing-presets.ts`

| Intent | Fields (keys) |
|--------|----------------|
| `share-idea` | topic, audience, angle?, proof? |
| `explain-deeply` | topic, thesis, outline?, audience? |
| `engage-audience` | topic, hypothesis, question?, evidence? |
| `tell-story` | topic, hook, beats? |
| `update-subscribers` | topic, audience, promise?, sections? |
| `document-decision` | systemContext, tradeoffs, decision? |

Reuse field copy from existing `content-type-presets.ts` where possible; decouple from `contentType` id in i18n (`intent-briefing.ts`).

## Intent resolver (temporary)

**File:** `apps/backend/src/product/generation/intent-resolver.ts`

### Mapping table (v1)

Primary key: `(intent, lengthTier)` → `contentTypeId`. Channel refines expression profile hint only.

| intent | short | medium | long |
|--------|-------|--------|------|
| `share-idea` | linkedin-post | linkedin-post | long-form-blog |
| `explain-deeply` | validation-post | architecture-post | long-form-blog |
| `engage-audience` | validation-post | linkedin-post | newsletter |
| `tell-story` | twitter-thread | twitter-thread | long-form-blog |
| `update-subscribers` | linkedin-post | newsletter | newsletter |
| `document-decision` | validation-post | architecture-post | architecture-post |

**Rationale:** pragmatic alpha mapping — not permanent. Documented in code as `PHASE1_LEGACY_INTENT_MAP`. Phase 2 replaces with `generationProfile` IDs.

### Resolver output

```typescript
interface ResolvedGenerationIntent {
  readonly intent: GenerationIntent;
  readonly scope: GenerationScope;
  readonly legacyContentTypeId: string;      // @phase1-legacy
  readonly wordTarget: { min: number; max: number };
  readonly channelHint: GenerationChannel;
}
```

`wordTarget` is passed into pipeline runtime inputs (`runtimeInputs.wordTarget`) for prompt constraints. Existing pipelines may ignore until prompts honor it — **implement minimal honor in draft/refine skills** (pass target into skill context).

## Backend modules

| Module | Action |
|--------|--------|
| `packages/contracts/src/generation-intent.ts` | Add |
| `packages/contracts/src/generation-preview.ts` | Extend request; optional intent fields in response metadata |
| `packages/contracts/src/execution/request.ts` | Extend `MeExecutionRequest` |
| `apps/backend/src/product/generation/intent-resolver.ts` | Add |
| `apps/backend/src/product/catalog/intent-briefing-presets.ts` | Add |
| `apps/backend/src/product/generation/generation-preview.ts` | Resolve intent before pricing |
| `apps/backend/src/product/generation/public-generation.ts` | Resolve intent in `toInternalPipelineRequest` |
| `apps/web/src/app/generation/` | Wizard components; deprecate format grid |
| `packages/client-sdk/` | Accept intent+scope on preview/execute |

## Billing & pricing (Phase 1)

- **No change** to `pricing.json` or plan allowances in Phase 1.
- Preview continues to use `creditPrice(legacyContentType, mode)` via resolver output.
- Document in code: pricing keys will migrate to `generationProfile × lengthTier` in Phase 2.
- Production calibration report (`docs/superpowers/reports/2026-06-18-hybrid-pricing-calibration.md`) remains valid input for Phase 2 repricing.

## Error handling

| Case | Behavior |
|------|----------|
| Unknown intent | 400 validation error |
| Intent + conflicting contentType | Prefer intent; log warning in alpha |
| Resolver maps to unavailable pipeline | 500 policy error with safe message |
| Tier gated quality mode | Unchanged (plan tier gates) |
| Insufficient credits | Unchanged |

## Testing

| Area | Scenarios |
|------|-----------|
| `intent-resolver.test.ts` | Every intent × tier resolves; word targets sane |
| `generation-preview` integration | Preview with intent matches execute resolution |
| Quote consistency | quoteId from intent-based preview works on execute |
| Web | Wizard step navigation; briefing fields per intent |
| Legacy flag | Advanced picker still works when flag on |
| i18n | pt/en for all intent labels and scope labels |

## Migration & rollout (alpha)

1. Ship backend intent support behind no flag (only web uses it).
2. Ship web wizard; remove public format grid.
3. Keep `GET /me/content-types` for one release with deprecation note in OpenAPI/contracts.
4. Remove web usage of content-types catalog when wizard stable.
5. Phase 2: remove legacy resolver map; switch pricing keys.

## Phase 2 preview (out of scope, for alignment)

- Replace `legacyContentTypeId` resolver with **`CompositorPlanner` → `ExecutionPlan`** (see [generation-compositor-design.md](./2026-06-19-generation-compositor-design.md)).
- Presets (`short-piece`, `long-piece`, `serial-piece`, `edition-piece`) seed the planner; users still only see intent + scope.
- Hybrid pricing keys: `planSignature × lengthTier × mode`.
- Deprecate and remove `contentType` from public API after parity sign-off.

## Phase 3 preview (out of scope)

- `StepPlanner` chooses skills dynamically from intent + briefing analysis.
- Profiles become defaults, not exclusive routes.

## Related documents

- [Hybrid pricing design](./2026-06-18-hybrid-pricing-design.md) — Phase 2 billing UX
- [Hybrid pricing calibration report](../reports/2026-06-18-hybrid-pricing-calibration.md) — token cost baseline
- [CONTEXT.md](../../CONTEXT.md) — Generation Request terminology
- [ADR 0002](../../adr/0002-plan-tier-quality-modes-and-default-free-subscription.md) — quality mode gating unchanged

## Open items (resolve during implementation planning)

1. Exact word ranges per `lengthTier` after prompt testing.
2. Whether `engage-audience` + `long` should map to `newsletter` or `long-form-blog` (current: newsletter).
3. Feature flag key namespace (`generation.legacy_format_picker` vs existing flags package).
4. Minimum skill changes to honor `wordTarget` in Phase 1 (draft only vs draft+refine).
