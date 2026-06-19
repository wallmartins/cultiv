# Generation Intent & Wizard — Phase 1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the public Content Type picker with a goal-first wizard (`intent` + `scope`) while resolving to legacy pipelines internally until Phase 2.

**Architecture:** New contracts and `IntentResolver` sit in the product layer; preview and execute share one resolver. Web wizard drives `intent`/`scope`; billing and execution continue using resolved `legacyContentTypeId`. `wordTarget` flows into draft/refine skill context.

**Tech Stack:** TypeScript, Effect-TS, Effect Schema, Vitest, Hono, React (`apps/web`), TanStack Router.

**Spec:** [`docs/superpowers/specs/2026-06-18-generation-intent-wizard-design.md`](../specs/2026-06-18-generation-intent-wizard-design.md)

**Roadmap:** [`docs/superpowers/specs/2026-06-18-content-formats-phased-roadmap.md`](../specs/2026-06-18-content-formats-phased-roadmap.md)

---

## Locked decisions (from spec + planning)

| Decision | Value |
|----------|--------|
| Word ranges | `short` 150–400, `medium` 400–1200, `long` 1200–3500 |
| `engage-audience` + `long` | Maps to `newsletter` |
| Legacy format picker flag | `generation.legacy_format_picker` (default `false`) |
| `wordTarget` in skills | `draft` + `refine` steps only (Phase 1) |
| Billing in Phase 1 | Unchanged — `creditPrice(legacyContentType, mode)` |
| Intent catalog API | `GET /me/generation-intents` (mirrors content-types pattern) |

## File map

| File | Responsibility |
|------|----------------|
| `packages/contracts/src/generation-intent.ts` | Intent, scope, channel, length tier schemas |
| `packages/contracts/src/generation-intents-catalog.ts` | Intent catalog view schema |
| `packages/contracts/src/generation-preview.ts` | Extend request + response metadata |
| `packages/contracts/src/execution/request.ts` | Extend `MeExecutionRequest` |
| `apps/backend/src/product/generation/intent-resolver.ts` | `@phase1-legacy` mapping table |
| `apps/backend/src/product/catalog/intent-briefing-presets.ts` | Briefing fields per intent |
| `apps/backend/src/product/catalog/generation-intent-catalog.ts` | Build intent catalog view |
| `apps/backend/src/routes/generation-intent-routes.ts` | `GET /me/generation-intents` |
| `apps/backend/src/product/generation/resolve-generation-target.ts` | Shared preview + execute resolver |
| `apps/backend/src/product/generation/generation-preview.ts` | Use resolver |
| `apps/backend/src/product/generation/public-generation.ts` | Use resolver + wordTarget |
| `packages/feature-flags/src/defaults.ts` | `generation.legacy_format_picker` |
| `apps/web/src/i18n/app/generation-intents.ts` | Intent/scope/channel labels |
| `apps/web/src/i18n/app/intent-briefing.ts` | Briefing guidance per intent |
| `apps/web/src/app/generation/hooks/useGenerationWizard.ts` | Wizard step state |
| `apps/web/src/app/generation/components/IntentWizard.tsx` | Steps 1–2 UI |
| `apps/web/src/app/generation/hooks/useGenerationForm.ts` | Intent-based form (replaces contentType) |
| `apps/web/src/app/generation/screens/GenerationScreen.tsx` | Wire wizard + compose step |
| `packages/client-sdk/src/generation-intents.ts` | SDK client for intent catalog |
| `tests/backend/intent-resolver.test.ts` | Resolver unit tests |
| `tests/backend/backend-generation-intent.test.ts` | API integration tests |
| `tests/web/generation-intent-i18n.test.ts` | i18n coverage |

## Out of scope

- Meta-pipelines (Phase 2), hybrid quota UI (Phase 2), marketing pages, removing `GET /me/content-types`.

---

## Task 1: Generation intent contracts

**Files:**
- Create: `packages/contracts/src/generation-intent.ts`
- Create: `packages/contracts/src/generation-intents-catalog.ts`
- Modify: `packages/contracts/src/index.ts`
- Create: `tests/contracts/generation-intent.test.ts`

- [ ] **Step 1: Write failing schema test**

```typescript
// tests/contracts/generation-intent.test.ts
import { describe, expect, it } from "vitest";
import { Schema } from "effect";
import {
  GenerationIntentSchema,
  GenerationScopeSchema,
  GenerationIntentRequestSchema
} from "../../packages/contracts/src/generation-intent.js";

describe("generation intent contracts", () => {
  it("decodes a valid intent request", () => {
    const decoded = Schema.decodeUnknownSync(GenerationIntentRequestSchema)({
      intent: "share-idea",
      scope: { lengthTier: "short", channel: "professional-network" },
      briefing: { topic: "Delegação" }
    });
    expect(decoded.intent).toBe("share-idea");
    expect(decoded.scope.lengthTier).toBe("short");
  });

  it("rejects unknown intent", () => {
    expect(() =>
      Schema.decodeUnknownSync(GenerationIntentSchema)("blog-post")
    ).toThrow();
  });
});
```

- [ ] **Step 2: Run test — expect FAIL**

Run: `pnpm exec vitest run tests/contracts/generation-intent.test.ts`

- [ ] **Step 3: Implement schemas**

```typescript
// packages/contracts/src/generation-intent.ts
import { Schema } from "effect";
import { QualityModeSchema } from "./execution/job.js";

export const GenerationIntentSchema = Schema.Literal(
  "share-idea",
  "explain-deeply",
  "engage-audience",
  "tell-story",
  "update-subscribers",
  "document-decision"
);
export type GenerationIntent = typeof GenerationIntentSchema.Type;

export const GenerationLengthTierSchema = Schema.Literal("short", "medium", "long");
export type GenerationLengthTier = typeof GenerationLengthTierSchema.Type;

export const GenerationChannelSchema = Schema.Literal(
  "unspecified",
  "professional-network",
  "blog",
  "email",
  "social"
);
export type GenerationChannel = typeof GenerationChannelSchema.Type;

export const GenerationScopeSchema = Schema.Struct({
  lengthTier: GenerationLengthTierSchema,
  channel: Schema.optional(GenerationChannelSchema)
});
export type GenerationScope = typeof GenerationScopeSchema.Type;

const BriefingValueSchema = Schema.Union(
  Schema.String,
  Schema.Record({ key: Schema.String, value: Schema.Unknown })
);

export const GenerationIntentRequestSchema = Schema.Struct({
  intent: GenerationIntentSchema,
  scope: GenerationScopeSchema,
  briefing: Schema.optional(BriefingValueSchema),
  importedContext: Schema.optional(Schema.String),
  language: Schema.optional(Schema.String),
  qualityMode: Schema.optional(QualityModeSchema)
});
export type GenerationIntentRequest = typeof GenerationIntentRequestSchema.Type;
```

```typescript
// packages/contracts/src/generation-intents-catalog.ts
import { Schema } from "effect";
import { GenerationIntentSchema } from "./generation-intent.js";
import { ContentTypeFieldViewSchema, BriefingGuidanceViewSchema } from "./content-types.js";

export const GenerationIntentCatalogItemSchema = Schema.Struct({
  id: GenerationIntentSchema,
  label: Schema.String,
  description: Schema.String,
  defaultLengthTier: Schema.Literal("short", "medium", "long"),
  featured: Schema.Boolean,
  inputSchema: Schema.Array(ContentTypeFieldViewSchema),
  briefingGuidance: BriefingGuidanceViewSchema
});

export const GenerationIntentCatalogViewSchema = Schema.Struct({
  items: Schema.Array(GenerationIntentCatalogItemSchema)
});
export type GenerationIntentCatalogView = typeof GenerationIntentCatalogViewSchema.Type;
```

Export from `packages/contracts/src/index.ts`.

- [ ] **Step 4: Run test — expect PASS**

- [ ] **Step 5: Commit**

```bash
git add packages/contracts/ tests/contracts/generation-intent.test.ts
git commit -m "feat(contracts): add generation intent and scope schemas"
```

---

## Task 2: Extend preview and execution request schemas

**Files:**
- Modify: `packages/contracts/src/generation-preview.ts`
- Modify: `packages/contracts/src/execution/request.ts`
- Modify: `tests/contracts/contracts-schema.test.ts`

- [ ] **Step 1: Extend `GenerationPreviewRequestSchema`**

Add optional fields (at least one path required — enforced in backend):

```typescript
import { GenerationIntentSchema, GenerationScopeSchema } from "./generation-intent.js";

// inside GenerationPreviewRequestSchema:
intent: Schema.optional(GenerationIntentSchema),
scope: Schema.optional(GenerationScopeSchema),
```

Add to `GenerationPreviewResponseSchema`:

```typescript
resolvedIntent: Schema.optional(
  Schema.Struct({
    intent: GenerationIntentSchema,
    scope: GenerationScopeSchema,
    wordTargetMin: Schema.Number,
    wordTargetMax: Schema.Number
  })
),
```

- [ ] **Step 2: Extend `MeExecutionRequestSchema`**

```typescript
intent: Schema.optional(GenerationIntentSchema),
scope: Schema.optional(GenerationScopeSchema),
contentType: Schema.optional(Schema.String), // was required — now optional when intent present
```

Use a custom filter in backend (Task 5) — schema stays optional on both for transitional tests.

- [ ] **Step 3: Update `contracts-schema.test.ts`** with intent-based preview decode sample.

- [ ] **Step 4: Run** `pnpm exec vitest run tests/contracts/`

- [ ] **Step 5: Commit** `feat(contracts): extend preview and execution requests with intent`

---

## Task 3: Intent resolver

**Files:**
- Create: `apps/backend/src/product/generation/intent-resolver.ts`
- Create: `tests/backend/intent-resolver.test.ts`

- [ ] **Step 1: Write failing resolver tests (all 18 cells + word targets)**

```typescript
import { describe, expect, it } from "vitest";
import { resolveGenerationIntent } from "../../apps/backend/src/product/generation/intent-resolver.js";

describe("resolveGenerationIntent", () => {
  it("maps share-idea short to linkedin-post", () => {
    const resolved = resolveGenerationIntent({
      intent: "share-idea",
      scope: { lengthTier: "short" }
    });
    expect(resolved.legacyContentTypeId).toBe("linkedin-post");
    expect(resolved.wordTarget).toEqual({ min: 150, max: 400 });
  });

  it("maps engage-audience long to newsletter", () => {
    const resolved = resolveGenerationIntent({
      intent: "engage-audience",
      scope: { lengthTier: "long" }
    });
    expect(resolved.legacyContentTypeId).toBe("newsletter");
  });

  it("defaults channel to unspecified", () => {
    const resolved = resolveGenerationIntent({
      intent: "tell-story",
      scope: { lengthTier: "medium" }
    });
    expect(resolved.channelHint).toBe("unspecified");
  });
});
```

Add one test per row in spec mapping table (18 combinations).

- [ ] **Step 2: Run test — FAIL**

- [ ] **Step 3: Implement resolver**

```typescript
// apps/backend/src/product/generation/intent-resolver.ts
import type { GenerationChannel, GenerationIntent, GenerationLengthTier, GenerationScope } from "@my-ai-orchestrator/contracts";

/** @phase1-legacy — replaced by generationProfile in Phase 2 */
const PHASE1_LEGACY_INTENT_MAP: Record<GenerationIntent, Record<GenerationLengthTier, string>> = {
  "share-idea": { short: "linkedin-post", medium: "linkedin-post", long: "long-form-blog" },
  "explain-deeply": { short: "validation-post", medium: "architecture-post", long: "long-form-blog" },
  "engage-audience": { short: "validation-post", medium: "linkedin-post", long: "newsletter" },
  "tell-story": { short: "twitter-thread", medium: "twitter-thread", long: "long-form-blog" },
  "update-subscribers": { short: "linkedin-post", medium: "newsletter", long: "newsletter" },
  "document-decision": { short: "validation-post", medium: "architecture-post", long: "architecture-post" }
};

const WORD_TARGETS: Record<GenerationLengthTier, { min: number; max: number }> = {
  short: { min: 150, max: 400 },
  medium: { min: 400, max: 1200 },
  long: { min: 1200, max: 3500 }
};

const DEFAULT_LENGTH_BY_INTENT: Record<GenerationIntent, GenerationLengthTier> = {
  "share-idea": "short",
  "explain-deeply": "long",
  "engage-audience": "short",
  "tell-story": "medium",
  "update-subscribers": "long",
  "document-decision": "medium"
};

export interface ResolvedGenerationIntent {
  readonly intent: GenerationIntent;
  readonly scope: GenerationScope;
  readonly legacyContentTypeId: string;
  readonly wordTarget: { readonly min: number; readonly max: number };
  readonly channelHint: GenerationChannel;
}

export function defaultLengthTierForIntent(intent: GenerationIntent): GenerationLengthTier {
  return DEFAULT_LENGTH_BY_INTENT[intent];
}

export function resolveGenerationIntent(input: {
  readonly intent: GenerationIntent;
  readonly scope: GenerationScope;
}): ResolvedGenerationIntent {
  const channelHint = input.scope.channel ?? "unspecified";
  const legacyContentTypeId = PHASE1_LEGACY_INTENT_MAP[input.intent][input.scope.lengthTier];

  return {
    intent: input.intent,
    scope: input.scope,
    legacyContentTypeId,
    wordTarget: WORD_TARGETS[input.scope.lengthTier],
    channelHint
  };
}
```

- [ ] **Step 4: Run tests — PASS**

- [ ] **Step 5: Commit** `feat(backend): add phase-1 legacy intent resolver`

---

## Task 4: Intent briefing presets + catalog

**Files:**
- Create: `apps/backend/src/product/catalog/intent-briefing-presets.ts`
- Create: `apps/backend/src/product/catalog/generation-intent-catalog.ts`
- Create: `apps/backend/src/routes/generation-intent-routes.ts`
- Modify: `apps/backend/src/app/routes.ts` (register routes)
- Create: `tests/backend/backend-generation-intents.test.ts`

- [ ] **Step 1: Copy field definitions from `content-type-presets.ts` into intent-keyed map** per spec table (`share-idea` ← linkedin fields, etc.).

- [ ] **Step 2: `buildGenerationIntentCatalogView(locale)`** returns featured intents (5) + `document-decision` with `featured: false`.

- [ ] **Step 3: Add route**

```typescript
// apps/backend/src/routes/generation-intent-routes.ts
app.get("/me/generation-intents", async (c) => {
  const actor = await resolvePublicActor(c, options.config, Routes.GetMeGenerationIntents, options.services);
  const voiceProfile = await runEffectOrThrow(options.services.database.voiceProfiles.getByUser(actor.userId));
  const primaryLanguage = voiceProfile?.primaryLanguage ?? options.config.defaultLanguage;
  const items = buildGenerationIntentCatalogView(primaryLanguage);
  return c.json(await validateResponseBody(GenerationIntentCatalogViewSchema, { items }, "GenerationIntentCatalogView"));
});
```

Add route definition to `route-definitions.ts`.

- [ ] **Step 4: Integration test** — authenticated GET returns 6 intents, `share-idea` has `inputSchema` with `topic`.

- [ ] **Step 5: Commit** `feat(backend): expose generation intent catalog API`

---

## Task 5: Shared resolve-generation-target + preview integration

**Files:**
- Create: `apps/backend/src/product/generation/resolve-generation-target.ts`
- Modify: `apps/backend/src/product/generation/generation-preview.ts`
- Modify: `tests/backend/backend-generation-preview.test.ts`

- [ ] **Step 1: Implement `resolveGenerationTarget(request)`**

```typescript
export function resolveGenerationTarget(request: {
  readonly intent?: GenerationIntent;
  readonly scope?: GenerationScope;
  readonly contentType?: string;
}): Effect.Effect<ResolvedGenerationIntent & { contentTypeId: string }, BackendValidationError> {
  if (request.intent && request.scope) {
    const resolved = resolveGenerationIntent({ intent: request.intent, scope: request.scope });
    return Effect.succeed({ ...resolved, contentTypeId: resolved.legacyContentTypeId });
  }
  if (request.contentType) {
    // legacy path: synthetic resolvedIntent omitted from response
    return Effect.succeed(/* map contentType only */);
  }
  return Effect.fail(/* 400 both missing */);
}
```

- [ ] **Step 2: Update `generation-preview.ts`** — call `resolveGenerationTarget` first; pass `contentTypeId` into existing pricing/catalog logic; attach `resolvedIntent` to response.

- [ ] **Step 3: Add test** `POST /api/generation-preview` with intent `share-idea` + scope `short` returns pricing for linkedin-post and `resolvedIntent` block.

- [ ] **Step 4: Run** `pnpm exec vitest run tests/backend/backend-generation-preview.test.ts tests/backend/backend-generation-intent.test.ts`

- [ ] **Step 5: Commit** `feat(backend): resolve intent in generation preview`

---

## Task 6: Public generation execute path

**Files:**
- Modify: `apps/backend/src/product/generation/public-generation.ts`
- Modify: `apps/backend/src/execution/runtime-selection.ts` or pipeline runtime inputs (wordTarget)
- Modify: `tests/backend/backend-app-executions-quotes.test.ts`

- [ ] **Step 1: In `toInternalPipelineRequest`**, call `resolveGenerationTarget`; set `contentType` from resolved id.

- [ ] **Step 2: Pass `wordTarget` into execution context**

In `toInternalPipelineRequest` or enqueue payload, add to `context`:

```typescript
context: {
  ...request.context,
  wordTarget: resolved.wordTarget,
  generationIntent: resolved.intent,
  generationChannel: resolved.channelHint
}
```

- [ ] **Step 3: Test** — preview with intent + execute with same intent/`quoteId` succeeds; quote mismatch still fails.

- [ ] **Step 4: Commit** `feat(backend): resolve intent on execution enqueue`

---

## Task 7: Word target in draft/refine skills

**Files:**
- Modify: skill prompt builders that handle `draft` and `refine` (locate via `packages/skills` or `apps/backend/src/execution`)
- Create: `tests/backend/word-target-prompt.test.ts` (unit test on prompt fragment)

- [ ] **Step 1: Find draft/refine instruction builders** — search `skill === "draft"` / `"refine"`.

- [ ] **Step 2: When `context.wordTarget` present, append:**

```
Target length: between {min} and {max} words.
```

- [ ] **Step 3: Unit test** — builder includes word range when context provided.

- [ ] **Step 4: Commit** `feat(backend): pass wordTarget into draft and refine prompts`

---

## Task 8: Feature flag for legacy format picker

**Files:**
- Modify: `packages/feature-flags/src/defaults.ts`
- Modify: `packages/contracts/src/content-types.ts` (optional `deprecated?: boolean` on catalog item)
- Modify: `apps/backend/src/product/catalog/content-type-catalog.ts`

- [ ] **Step 1: Add flag**

```typescript
{
  key: "generation.legacy_format_picker",
  scope: "generation",
  enabled: false,
  defaultVariant: "off",
  variants: ["off", "on"]
}
```

- [ ] **Step 2: Mark content type catalog items `deprecated: true`** in view when building (or static in schema default false for old clients).

- [ ] **Step 3: Commit** `feat(flags): add generation.legacy_format_picker feature flag`

---

## Task 9: Client SDK generation intents

**Files:**
- Create: `packages/client-sdk/src/generation-intents.ts`
- Modify: `packages/client-sdk/src/client.ts`
- Modify: `packages/client-sdk/src/index.ts`

- [ ] **Step 1: `createGenerationIntentsClient`** — `GET /me/generation-intents` with decode.

- [ ] **Step 2: Wire on `ClientSdk` as `generationIntents.list()`.

- [ ] **Step 3: Commit** `feat(sdk): add generation intents catalog client`

---

## Task 10: Web i18n for intents

**Files:**
- Create: `apps/web/src/i18n/app/generation-intents.ts`
- Create: `apps/web/src/i18n/app/intent-briefing.ts`
- Modify: `apps/web/src/i18n/app/types.ts`
- Modify: `apps/web/src/i18n/app/messages/pt.ts` and `en.ts`
- Create: `tests/web/generation-intent-i18n.test.ts`

- [ ] **Step 1: Add labels/descriptions** for all 6 intents, 3 length tiers, 5 channels (pt/en).

- [ ] **Step 2: Add briefing guidance** per intent (mirror backend presets copy, localized).

- [ ] **Step 3: Test** — all intent ids have pt/en labels.

- [ ] **Step 4: Commit** `feat(web): i18n for generation intent wizard`

---

## Task 11: Wizard UI components

**Files:**
- Create: `apps/web/src/app/generation/hooks/useGenerationWizard.ts`
- Create: `apps/web/src/app/generation/components/IntentWizard.tsx`
- Create: `apps/web/src/app/generation/lib/use-generation-intents.ts`

- [ ] **Step 1: `useGenerationIntents`** — fetch `client.generationIntents.list()`, merge with i18n labels.

- [ ] **Step 2: `useGenerationWizard`** — state: `step` (1|2|3), `intent`, `scope`, `showMoreIntents`.

Step 1 → pick intent (sets default `lengthTier` from catalog item).  
Step 2 → length segmented control + collapsible channel select.  
Advance to step 3 when intent + length set.

- [ ] **Step 3: `IntentWizard` component** — renders steps 1–2 with `AppCard` / `AppSegmentedControl` matching existing design system.

- [ ] **Step 4: Commit** `feat(web): generation intent wizard components`

---

## Task 12: Refactor generation form + screen

**Files:**
- Modify: `apps/web/src/app/generation/hooks/useGenerationForm.ts`
- Modify: `apps/web/src/app/generation/screens/GenerationScreen.tsx`
- Modify: `apps/web/src/app/generation/lib/use-generation-preview.ts` (if needed)
- Modify: `apps/web/src/app/generation/lib/generate-prefill.ts` (map legacy prefill → intent if possible)

- [ ] **Step 1: Replace `contentTypeId` with `intent` + `scope` in form state.**

- [ ] **Step 2: `commercialRequest` / `fullPreviewRequest` send `intent` + `scope` instead of `contentType`.**

- [ ] **Step 3: Briefing form reads `inputSchema` from selected intent catalog item** (not content-types).

- [ ] **Step 4: GenerationScreen layout:**

```
[ IntentWizard steps 1-2 when step < 3 ]
[ BriefingForm + quality + language when step === 3 ]
[ GenerationPreviewSidebar ]
```

- [ ] **Step 5: Remove public content-type grid** unless feature flag `generation.legacy_format_picker` is on for user (read flag from catalog commercial or dedicated endpoint — use feature flag evaluator if exposed to web, else env `VITE_LEGACY_FORMAT_PICKER` for alpha).

For alpha simplicity: **`import.meta.env.DEV`** or flag from `catalog.commercial` extension — implementer checks existing feature-flag web pattern.

- [ ] **Step 6: Update `handleGenerate`** — `executions.create({ intent, scope, briefing, ... })` without `contentType`.

- [ ] **Step 7: Commit** `feat(web): wire generation screen to intent wizard`

---

## Task 13: End-to-end verification

- [ ] **Run full test suite**

```bash
pnpm test:ci
```

Expected: all pass

- [ ] **Manual alpha smoke**

1. Open Generation Screen — see objective cards, not six formats.
2. Pick "Compartilhar uma ideia" → Curto → briefing → preview shows price.
3. Generate — execution completes.
4. Legacy path: enable flag → old format picker visible.

- [ ] **Update spec status** to `approved` in `2026-06-18-generation-intent-wizard-design.md`.

- [ ] **Append progress-log** entry.

---

## Self-review (spec coverage)

| Spec requirement | Task |
|------------------|------|
| GenerationIntent + Scope contracts | 1–2 |
| Wizard 3 steps | 11–12 |
| IntentResolver `@phase1-legacy` | 3 |
| Briefing per intent | 4, 10 |
| Preview + execute same resolver | 5–6 |
| wordTarget in pipeline | 6–7 |
| Legacy format flag | 8, 12 |
| No billing changes | (none) |
| GET /me/content-types deprecated | 8 |
| i18n pt/en | 10 |
| Tests | 3, 4, 5, 6, 10, 13 |

**Deferred to Phase 2:** quota UX, meta-pipelines, pricing migration.

---

## Execution handoff

Plan complete and saved to `docs/superpowers/plans/2026-06-18-generation-intent-wizard.md`.

**Two execution options:**

1. **Subagent-Driven (recommended)** — fresh subagent per task, review between tasks  
2. **Inline Execution** — implement tasks in this session with checkpoints

Which approach do you prefer?
