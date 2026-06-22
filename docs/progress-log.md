# Progress Log

| 2026-06-22 | feat(billing): add Criador plan (starter tier, 63 credits) + gateway catalog + billing UI |
| 2026-06-22 | feat(billing): policy `2026-06-22` — step-planner COGS-calibrated `pricesByPlan`; plan grants 20/150 monthly credits |
| 2026-06-19 | test(step-planner): integration coverage, COGS variance harness, planner telemetry — Phase 3 Tasks 8–10 |
| 2026-06-19 | feat(generation): wire step planner behind feature flag — Phase 3 Task 7 |
| 2026-06-19 | compositor parity PASS — founder rubric 6/6 on VPS; heroes signed off; spec approved |
| 2026-06-19 | fix(compositor): parity report rubric table scope bug |
| 2026-06-19 | fix(compositor): hide internal preset content types from /me/content-types; implement dominant COGS planSignature; CI green |
| 2026-06-19 | feat(compositor): Tasks 8–11 — policy catalog entries, expression instructions in skills, planSignature×lengthTier pricing grid, compositor telemetry metadata |
| 2026-06-19 | feat(compositor): Tasks 5–7 — `generation.compositor_v1` flag, resolve-generation-target compositor branch, preview/execute ExplicitPipelineRequest wiring; 15 new tests pass |
| 2026-06-19 | feat(compositor): Tasks 2–4 — preset templates, rhetorical/scale/expression layers, CompositorPlanner + materializer; 17 unit tests pass |
| 2026-06-19 | docs: Phase 2 generation compositor implementation plan (14 tasks) |
| 2026-06-19 | docs: Phase 2 generation compositor design — planner v1, presets as templates, parity harness gate |
| 2026-06-19 | fix(billing): bundle calibration scripts to dist/scripts for VPS prod installs without tsx |
| 2026-06-19 | feat(billing): calibration sweep scripts for Option B viability — `run-calibration-sweep`, `analyze-calibration-option-b`, tier-variance profile, runbook |
| 2026-06-19 | fix(phase1): close review gaps — shared legacy map in contracts, resolveGenerationTarget tests, wizard/prefill tests, legacy flag default off, mergeIntentPipelineContext |
| 2026-06-19 | feat(web): Phase 1 generation intent wizard complete — contracts, resolver, catalog API, preview/execute, wordTarget prompts, SDK, i18n, IntentWizard + GenerationScreen; 800 tests pass |
| 2026-06-19 | feat(backend): resolve intent on execution enqueue (intent wizard Task 6) |
| 2026-06-19 | feat(backend): pass wordTarget into draft and refine prompts (intent wizard Task 7) |
| 2026-06-18 | docs: Phase 1 generation intent wizard implementation plan (13 tasks) |
| 2026-06-18 | docs: Phase 1 generation intent & wizard spec; phased roadmap (formats + pricing) |
| 2026-06-18 | feat(billing): pricing calibration toolkit + export/calibrate scripts (Phase 0) |
| 2026-06-18 | docs: hybrid pricing implementation plan (10 tasks, calibration → repricing → quota UX) |
| 2026-06-18 | docs: hybrid pricing design spec — token-calibrated internal credits, quota presentation layer, Free/Criador/Pro ladder, Generation Screen educational copy (no internal credit exposure) |
| 2026-06-18 | merge(main): integrate payment gateway (Stripe/Asaas) with architecture-deepening modular payments and split config |
| 2026-06-18 | refactor(backend,voice): extract `voice-rebuild-derivation-resolvers.ts` (178 lines) — resolvers + text/diversity helpers from `voice-rebuild-derivation.ts` (447→283); `apps/backend/tests/voice-rebuild-derivation-resolvers.test.ts` (3 tests); removed `voice-rebuild-derivation.ts` from file-size allowlist; public API unchanged |
| 2026-06-18 | refactor(payments): extract generation credit and cycle operations — `billing-generation-credits.ts`, `billing-cycle-operations.ts`, `billing-service-runtime.ts`; `service.ts` 520→240 lines; removed from file-size allowlist; `tests/payments/billing-generation-credits.test.ts`; file-size allowlist now empty |
| 2026-06-18 | refactor(backend,voice): extract `voice-rebuild-pipeline-diagnostics.ts` (`markRebuildQueued`, `markRebuildFailure`, `clearProfileImpactFlags`, `attachTraitProfileToDevelopment`); `voice-rebuild-pipeline.ts` 445→298 lines; removed from file-size allowlist; `apps/backend/tests/voice-rebuild-pipeline-diagnostics.test.ts` (4 tests) |
| 2026-06-18 | docs: architecture-deepening phases 3–6 complete — allowlist empty after final splits |
| 2026-06-18 | refactor(web): Fase 4 — split `GenerationScreen.tsx` (657→349 lines) into hooks (`useGenerationForm`, `useGenerationCommercialGate`), `get-blocked-reason.ts`, `GenerationPreviewSidebar`, `BriefingGuidancePanel`; `tests/web/use-generation-commercial-gate.test.ts` (8 tests) |
| 2026-06-18 | refactor(backend): Fase 6c — split `config.ts` (413→44 lines) into `config-schema.ts`, `config-env.ts`, `config-validate.ts`; removed from file-size allowlist; `tests/backend/backend-config.test.ts` imports `validateBackendConfig` from `config-validate` |
| 2026-06-18 | test(client-sdk): `tests/client-sdk/http-retry.test.ts` — GET retries on 429 then succeeds via `createHttpTransport` |
| 2026-06-18 | refactor(contracts): Fase 6b — split `execution.ts` (476→1 line) into `execution/{job,request,view,sse,errors}.ts`; thin barrel preserved; `tests/contracts/execution-modules.test.ts`; removed `execution.ts` from file-size allowlist; public API unchanged |
| 2026-06-18 | refactor(feature-flags): Fase 6a — split `index.ts` (455→47 lines) into `defaults.ts`, `types.ts`, `registry.ts`, `evaluator.ts`, `service.ts`, `validation.ts`, `domain-helpers.ts`; removed `index.ts` from file-size allowlist; `tests/feature-flags/feature-flags-module.test.ts`; public API unchanged |
| 2026-06-18 | refactor(backend,voice): Fase 3 — split `voice-rebuild-service.ts` (547→38 lines) into `voice-rebuild-queue.ts` (113), `voice-rebuild-pipeline.ts` (445); `apps/backend/tests/voice-rebuild-queue.test.ts`, `voice-rebuild-pipeline.test.ts`; removed `voice-rebuild-service.ts` from file-size allowlist; behavior unchanged |
| 2026-06-18 | refactor(backend): split postgres billing store — `billing/billing-persist-queue.ts`, `billing-row-mappers.ts`, `postgres-billing-repository.ts`, `billing-snapshot-migration.ts`; `postgres-billing-store.ts` 422→17 lines (facade); removed from file-size allowlist; `apps/backend/tests/billing-row-mappers.test.ts`, `billing-persist-queue.test.ts`; Fase 5 done |
| 2026-06-18 | refactor(backend): Task 2.4 — extract `in-memory-job-repository.ts` (Map CRUD); `job-store.ts` 421→255 lines (composition + event bus); removed `job-store.ts` and `durable-job-runtime.ts` from file-size allowlist; `apps/backend/tests/in-memory-job-repository.test.ts`; Fase 2 done |
| 2026-06-18 | refactor(backend): Task 2.3 — extract `execution-enqueue-transaction.ts` (`resolveEnqueueUserId`, `buildRuntimeBase`, `buildExecutionJobRecord`, `runExecutionEnqueueTransaction`); `durable-job-runtime.ts` 466→325 lines (baseline); `apps/backend/tests/execution-enqueue-transaction.test.ts`; enqueue path behavior unchanged |
| 2026-06-18 | refactor(backend): Task 2.1 — extract `job-status-mappers.ts` (`resolveContentType`, `resolveEstimatedSteps`, `toJobStatusResponse`); dedupe from `job-store.ts` (−16 lines) and `durable-job-runtime.ts` (−27 lines); `apps/backend/tests/job-status-mappers.test.ts`; behavior unchanged |
| 2026-06-18 | refactor(payments): Task 1.5 — extract domain types to `packages/payments/src/types.ts` and entitlement helpers to `entitlement.ts`; `index.ts` 321→73 lines (re-exports only); internal imports use `./types.js`; removed `index.ts` from file-size allowlist; `tests/payments/billing-types-module.test.ts`; public API unchanged |
| 2026-06-18 | refactor(payments): Task 1.3 — extract ledger/wallet logic to `packages/payments/src/ledger.ts` (`appendLedgerEntry`, `createWalletFromRepository`, `createEntitlementFromRepository`, `sumLedger`); `service.ts` 631→520 lines; `tests/payments/billing-ledger.test.ts`; public API unchanged |
| 2026-06-18 | refactor(payments): Task 1.2 — extract `BillingService` to `packages/payments/src/service.ts`; shared helpers in `billing-utils.ts`; repository/plan/credit/subscription modules to break circular deps; `tests/payments/billing-service-module.test.ts`; public API unchanged |
| 2026-06-18 | refactor(payments): Task 1.1 — extract gateway adapters to `packages/payments/src/gateway/`; types in `gateway/types.ts`; public API unchanged via index re-exports; `tests/payments/gateway-adapters.test.ts` |
| 2026-06-18 | docs: architecture deepening plan — fases 0–6, allowlist, TDD, dependências |
| 2026-06-18 | test(governance): file-size governance — 400-line budget for production TS; allowlist with baselines (now empty) |
| 2026-06-17 | fix(payments): align gateway adapters with effect-hardening governance — tagged errors, allow stripe dep |
| 2026-06-17 | fix(ci): grant `pull-requests: read` on path-filter job — fixes paths-filter API error and skipped downstream checks on PRs |
| 2026-06-17 | feat(billing): phase 1b–1c — PIX checkout, top-up webhook grant, client SDK billing, `/app/billing` UI, annual installments (tasks 14–18) |
| 2026-06-17 | feat(backend): billing checkout + webhook routes, gateway services, Stripe/Asaas config |
| 2026-06-17 | feat(payments): Stripe + Asaas adapters, webhook dispatch (tasks 7–9) |
| 2026-06-17 | pause(payment-gateway): Tasks 1–6 done on `feat/payment-gateway`; resume at Task 7 (Stripe adapter) |
| 2026-06-17 | feat(backend): PostgreSQL billing gateway store — checkout intents, catalog lookup, customer/subscription upserts, event dedup |
| 2026-06-17 | feat(backend): billing gateway PostgreSQL tables — migration 0010, five tables, dev catalog seed |
| 2026-06-17 | feat(payments): currency-based gateway router — BRL→asaas, USD→stripe (`resolveGatewayForCurrency`) |
| 2026-06-17 | docs: payment gateway implementation plan (18 tasks, phases 1a–1c) |
| 2026-06-17 | docs: payment gateway design spec (Stripe + Asaas hybrid) — checkout, webhooks, BRL/USD routing, security model |
| 2026-06-17 | fix(web,voice): localize moveLabels — pt dictionary + key normalization; extraction prompt requires moveLabels in output language |
| 2026-06-17 | feat: Development Traits program (issues 82–87) — contracts, confidence pass, divergence/reconciliation, dashboard mirror, generation pass-through, confirmation API, regression corpus |
| 2026-06-17 | docs: issue 87 Development Traits generation pass-through (hints, snapshots, prompt summary) |
| 2026-06-17 | docs: PRD + issues 82–86 Development Traits and Author Confidence (ADR 0008); parent issue + README indexados |
| 2026-06-17 | docs: ADR 0008 Development Traits — structured author development answers, trait confidence, evidence mirror, confirmation loop; plan epics 82–86 |
| 2026-06-17 | fix(voice): ADS review fixes — shared extraction JSON/errors, development drift heuristic, divergence rules, judge trigger logging, appliedSignals wiring, regression corpus, golden fixtures, reconciliation flow tests, `pnpm eval:development` |
| 2026-06-17 | feat(voice): Argument Development Signature issues 74–81 — contracts, parallel extraction, divergence/reconciliation, prompts, drift/critic, judge policy, dashboard hero |
| 2026-06-17 | docs: issues 74–81 Argument Development Signature (épicos A–H); parent issue + README indexados |
| 2026-06-17 | docs: PRD + plan Argument Development Signature (ADR 0007) — épicos 74–81, parallel extraction, conditional reconciliation, development drift, judge policy, dashboard hero |
| 2026-06-17 | docs: ADR 0007 Argument Development Signature — parallel extraction, conditional reconciliation, step-scoped injection, development drift in all quality modes, judge reinforcement rules, dashboard two-block hero |
| 2026-06-17 | fix(web): restore moss uppercase meta styling on voice confidence dial center label |
| 2026-06-17 | fix(web): show only Cultiv growth subline inside voice confidence dial |
| 2026-06-17 | fix(voice): enforce pt-BR narrativeProse in reasoning extraction with stronger prompts, retry, and test fixture |
| 2026-06-17 | feat(web): Voice mirror hero with confidence dial and Cultiv growth sublines |
| 2026-06-16 | fix(web): Voice Dashboard polish — inline confidence status, full-width next step strip, reasoning extraction in example language |
| 2026-06-16 | fix(voice): review follow-ups — flag-off anti-pattern gating, extraction failure diagnostics, judge observability, critic dedup, explicit reasoningEvaluationEnabled, quality-voice-judge orchestration, VoiceReasoningSection tests |
| 2026-06-16 | feat(voice): issues 66–73 Author Reasoning Signature — contracts, extraction on rebuild, format-only presets, step-scoped prompts, reasoning drift/critic, Groq voice judge, dashboard presentation, regression corpus (7 personas / 37 briefings), `pnpm eval:reasoning`, P0 drift/prompt fixes, golden extraction corpora, deploy/subprocessor docs; flag `voice.reasoningSignatureV1` |

| 2026-06-16 | docs: issues 66–73 Author Reasoning Signature (épicos A–H); README e plan indexados |

| 2026-06-16 | docs: PRD + plan Author Reasoning Signature (ADR 0006); epics A–H; READMEs live atualizados |

| 2026-06-16 | docs: ADR 0006 author reasoning signature; kickoff renomeado para `improve-voice-kickoff.md`; CONTEXT.md com glossário de raciocínio autoral |

| 2026-06-16 | feat(payments): `activateSubscription` + `ensureBillingCycleInitialized` no JIT; CLI `pnpm billing:activate` |

| 2026-06-16 | fix(tests): teardown BullMQ/SSE Redis no durable CI + `dangerouslyIgnoreUnhandledErrors` na suite |

| 2026-06-16 | fix(backend,ci): lint postgres-billing mappers + `Generated` ledger id + `BillingDbExecutor`; durable tests 13/13 local |

| 2026-06-16 | ci: job `CI gate` agrega resultados (skipped ok) — único required check para branch protection / Vercel |

| 2026-06-16 | ci: path filters — só web pula build/test backend; só backend pula build web; shared/packages disparam ambos |

| 2026-06-16 | ci: jobs paralelos (lint/test/build/durable), `test:ci` sem duplicar web, deploy VPS só após CI verde em main; deploy manual separado |

| 2026-06-16 | feat(backend): runtime durável completo — enqueue atômico com billing na txn, paginação PG, claim worker, SSE terminal replay, waitlist só Redis, testes CI |

| 2026-06-16 | feat(backend): billing relacional PostgreSQL (migration 0006) — load/save/backfill; `durable-store` prefere tabelas; testes de persistência |

| 2026-06-16 | fix(backend): resolve billing entitlements from stored subscription, not BILLING_PLAN_ID env |

| 2026-06-16 | UX preview: stale-while-revalidate — skeleton só na carga inicial; atualizações com opacidade suave |

| 2026-06-16 | feat(web+backend): preview comercial leve (formato/idioma/modo) vs recomendação completa sob demanda (`includeRecommendation`) |

| 2026-06-16 | fix(web): histórico com Outlet + index route; drawer com scroll no texto gerado |

| 2026-06-16 | fix: usage policy model check uses request quality mode (`backend-fast`) not server default (`cultiv-balanced`) |

| 2026-06-16 | UX tela de voz: redirect pós-salvar para `/app/voice`, copy rica de confiança/diagnósticos (i18n), cobertura por formatos faltantes + parabéns, remoção de botões duplicados na seção de cobertura |

| 2026-06-14 | `--encrypt-plaintext` no `rotate-voice-key` para criptografar exemplos legados em claro |

| 2026-06-14 | Voice key rotation: `VOICE_DATA_PROTECTION_KEY_PREVIOUS`, CLI `rotate-voice-key`, runbook §7 |

| 2026-06-14 | Railway deploy: `railway.toml` (api) + `railway.worker.toml` (worker); runbook Phase 2 |

## 2026-06-14 — Web `src/` restructure (pré-deploy)

- Layout por superfície: `marketing/`, `app/{generation,voice,history,...}`, `platform/`
- `routes/` mantido (convenção TanStack Start)
- `i18n/marketing/` separado de `i18n/app/`
- Scripts: `scripts/restructure-web-src.mjs`, `scripts/fix-web-imports.mjs`
- Governança: `frontend-client-boundary` atualizado para `/platform/server/`
- **582 testes passando**; `pnpm --filter @my-ai-orchestrator/web build` OK

## 2026-06-14 — Backend `src/` restructure (pré-deploy)

- Layout por domínio: `cli/`, `app/`, `config/`, `http/`, `routes/`, `jobs/`, `product/*`, `execution/pipeline|quality`, etc.
- Scripts: `scripts/restructure-backend-src.mjs`, `scripts/fix-backend-imports.mjs`
- Entry points: `src/cli/main.ts`, `worker-main.ts`, `migrate.ts`, `rotate-voice-protection-key.ts`
- Fix `resolveBackendEnvPaths` após mover `config.ts` → `config/config.ts` (`.env` do monorepo volta a resolver)
- **582 testes passando**; `pnpm build:backend` OK (`dist/cli/*.js`)

## 2026-06-14 — Production go-live runbook + config hardening

- Runbook: `docs/live/runbooks/production-go-live.md` (Vercel + Railway + Auth0 + smoke)
- Produção: boot falha se `BACKEND_ALLOW_IN_MEMORY_RUNTIME=true`, `EXECUTION_MODE!=async`, CORS vazio, `VOICE_DATA_PROTECTION_KEY` ausente/<32 chars
- CI: `pnpm test` no job principal; `apps/web/.env.example` documenta `REDIS_URL` para waitlist

## 2026-06-14 — Backend trust proxy + compiled production build

- `resolveTrustedClientIp`: `cf-connecting-ip` > `x-real-ip` / `x-forwarded-for` (com `BACKEND_TRUST_PROXY`, default prod) > socket
- Build de produção via esbuild (`dist/main.js`, `worker-main.js`, `migrate.js` + migrations compiladas)
- Scripts: `start`/`worker`/`migrate` usam `node dist/*`; `migrate:dev` mantém `tsx` para dev local
- CI: `pnpm build:backend` após lint

## 2026-06-14 — Durable Async Runtime HITL (issue 57)

- Runbook: `docs/live/runbooks/durable-async-runtime-hitl.md`; smoke `pnpm hitl:durable-smoke`
- Fix smoke seed: billing snapshot reset, voice example, `SERVICE_NAME=backend`; fix `voice-hints` null-safe hints
- Worker reloads billing snapshot from PG before each job (`reloadBillingRepositoryInto`) — fixes capture after API enqueue
- Local: `pnpm hitl:durable-smoke` §4 OK (`done`); `pnpm test:durable` 8/8; Redis AOF `yes`
- Pending manual: §2 edge rate limit doc, §5 web drawer restart

## 2026-06-14 — Durable Async Runtime verification (issues 48–57 completion)

- Idempotência extraída para `execution/idempotency-store.ts` (PG em durable, in-memory só fora de durable)
- `postgres-test-helpers`: migration 0005 + `clearDurableRuntimeTables`
- Suite `tests/backend/durable-runtime.integration.test.ts` (6 cenários): enqueue PG+outbox, relay→BullMQ, restart API, billing snapshot, SSE fan-out, idempotency PG
- `pnpm test:durable` + job CI `durable-runtime` com Postgres+Redis
- `vitest.setup`: durable tests isolados via `VITEST_DURABLE_SUITE=true` (default `pnpm test` não roda integração)
- Fix `durable-billing.ts`: `runSync` → persist assíncrono agendado

## 2026-06-14 — Durable Async Runtime implementation (issues 48–57)

- Migration `0005-durable-runtime`: `jobs.user_id`, `billing_snapshots`, `outbox_events`, `execution_idempotency`
- Config: `REDIS_URL`, `BACKEND_ALLOW_IN_MEMORY_RUNTIME`, `EXECUTION_WORKER_CONCURRENCY`; dev/prod exige PG+Redis salvo flag de teste
- Billing durável via snapshot PG (`durable-billing.ts`, `durable-store.ts`)
- Runtime durável: `durable-job-runtime`, outbox relay, BullMQ queue, SSE Redis pub/sub, rate limit Redis
- API (`app.ts`) só inicia relay em modo durable; worker BullMQ em `worker-main.ts` (processo separado)
- Idempotência de execução em PG quando `runtimeMode === "durable"`
- Waitlist web: rate limit Redis (`waitlist-rate-limit.ts`); fallback in-memory só com `WAITLIST_ALLOW_IN_MEMORY_RATE_LIMIT=true`
- Testes: guard `durable-runtime-guard.test.ts`; integração PG+Redis gated por `RUN_DURABLE_RUNTIME_TESTS=true`
- Suite: 568 testes passando

## 2026-06-14 — Durable Async Runtime planning (docs)

- ADR 0004: zero in-process business state; PG SoR + Redis transport + transactional outbox; credit reserve at enqueue
- PRD, parent issue, implementation plan, and issues 48–57 in `docs/live/`
- Program covers billing PG, job SoR, BullMQ workers, SSE fan-out, durable limits, waitlist, verification gate

## 2026-06-14 — Workspace Visual Refresh implementation (web)

- Issues 39–46: tokens (`data-surface="workspace"`), primitives (AppCard/Field/Segmented/Skeleton), shell chrome, generation split layout, drawer, voice ring, history/onboarding/settings
- Issue 47: QA checklist added; manual sign-off pending

## 2026-06-14 — Workspace Visual Refresh planning (docs)

- PRD, parent issue, implementation plan, and issues 39–47 in `docs/live/`
- Tracks Jardim de Vidro refresh for `/app/*` per ADR 0003; marketing out of scope

## 2026-06-14 — Workspace Visual Refresh ADR (design)

- ADR 0003: Authenticated Workspace visual direction (Jardim de Vidro, sans-only, moss/golden, split Generation Screen, dock nav, confidence ring, drawer layout, contained motion)
- Marketing Surface explicitly out of scope; workspace tokens override locally in `apps/web`
- Glossary terms added/updated in `CONTEXT.md` during grill session

## 2026-06-12 — Quality mode tooltips with plan unlock hint (web)

- Each modo (Direto/Equilibrado/Afinado) has a `?` tooltip with description
- Modos indisponíveis mostram no tooltip o plano mínimo (ex.: “Disponível a partir do plano Pro”)
- Créditos insuficientes também aparecem só no tooltip; texto inline removido

## 2026-06-12 — Fix generate catalog (6 formats) + free-tier mode gating (web/backend)

- Catalog always lists all policy content types (not DB subset from past runs)
- `/me/content-types` returns `commercial.allowedQualityModes` for UI gating before preview
- Generation screen defaults to Direto and disables modes by plan tier immediately

## 2026-06-12 — Plan tier quality modes (issues 35–38)

- JIT auth provisions `free` subscription via `ensureDefaultFreeSubscription`
- Quality modes gated by tier in payments + preview/generation; all formats open with active subscription
- Generation screen disables unavailable modes with localized `blockedReason` copy
- ADR 0002, PRD, plan, issues 35–38

## 2026-06-12 — Plan tier quality modes docs (ADR + PRD + plan + issues)

- ADR 0002: formatos abertos; modos por tier; assinatura `free` no JIT
- PRD, plano de implementação, parent issue, issues 35–38

## 2026-06-12 — Generate screen i18n overlays (web)

- Localized briefing field labels/help text, guidance panel, language selector, and preview recommendation for `pt` app locale
- Added `briefing-guidance.ts`, `generation-languages.ts`, `preview-recommendation.ts`; expanded `field-labels.ts`

## 2026-06-12 — Onboarding fullscreen layout (web)

- `/app/onboarding` renders without AppShell (no header, sidebar, or bottom nav)
- Completed users hitting onboarding redirect to `/app/generate`

## 2026-06-12 — Product-friendly content type labels (web)

- Renamed format labels in app + marketing i18n (e.g. "Publicação profissional", "Teste de ideia")
- Added per-format descriptions under selectors in Generate and Voice composer

## 2026-06-12 — Fix SDK error unwrap + per-user onboarding gate (web)

- `client-sdk` `toPromise` now rejects typed `ClientSdkError` (fixes 404 → generic "Tente novamente")
- Onboarding/consent flags scoped per Auth0 `sub`; `OnboardingGate` redirects new users to `/app/onboarding`

## 2026-06-12 — Voice profile 404 empty state + consent API (web/backend)

- `GET /me/voice-profile` returns 404 until profile exists (new user) — dashboard now shows empty state + CTA
- Added `GET/POST /me/voice-training-consent`; composer grants backend consent on modal accept
- Mapped `voice_training_consent_required` API error code

## 2026-06-12 — Fix API auth token for voice-profile (web)

- `ClientSdkProvider` now bootstraps access token before exposing SDK (`useApiAccessToken` + session gate)
- `Auth0Provider` requests `offline_access` scope (required for `useRefreshTokens`)
- Client SDK transport fails fast when `getToken` is configured but returns empty (no silent 401)
- `ClientAuthProviders` shows loading until client mount (avoids `useAuth0` outside provider)

## 2026-06-12 — Fix dev CORS for Authenticated Workspace

- Backend `getCorsHeaders` only ran in `production`; development requests from `localhost:3000` got no `Access-Control-Allow-Origin`
- CORS now applies whenever the origin is allowed (configured `CORS_ALLOWED_ORIGINS` or dev defaults `localhost`/`127.0.0.1` on port 3000)
- OPTIONS preflight short-circuits in dev for allowed origins
- Web: removed global SDK error banner on credit fetch; fixed page title; catalog error with retry

## 2026-06-12 — Issues 29–34: Authenticated Workspace feature slice (web)

- **29 Generation:** `GenerationScreen` with catalog, dynamic `BriefingForm`, imported context (8k), quality modes (pt/en labels), debounced `preview.get`, `executions.create` → active list
- **30 Observation:** `ActiveExecutionProvider` with `executions.watch`, drawer (done/failed/running), completion toasts, observation failure recovery
- **31 History:** paginated `executions.list`, client filters, `/app/history/$executionId` detail with watch + regenerate prefill; `/app/generate/$executionId` ops route
- **32 Voice:** dashboard (`voice.getProfile`), examples list, shared `VoiceExampleComposer` (single vs batch), consent modal (local flag)
- **33 Onboarding + Settings:** 2-step `OnboardingFlow`, `SettingsScreen` with App Locale context, voice skip → `ReminderBanner` on generate
- **34 Governance:** full `app.*` i18n pt/en parity test, `map-sdk-error` + voice routing tests; QA checklist at `docs/live/plan/web-v2-qa-checklist.md`
- Shared: `AppLocaleProvider`, `NotificationHost`, `formatSdkError`, content-type/field-label overlays
- `pnpm test:web` (55), `apps/web` tsc + production build pass

## 2026-06-12 — Issue 28: App Shell + Active Execution shell (web)

- Added `AppShell` layout: header (`CreditDisplay`, avatar menu, mobile active-exec drawer), desktop sidebar, mobile bottom nav
- App i18n namespace `app.shell` under `apps/web/src/i18n/app/` (pt/en; locale from `cultiv.app.locale` or browser)
- `useCreditBalance()` fetches minimal `preview.get` with in-memory cache keyed `['creditBalance']`
- `ActiveExecutionProvider` + empty-state list (sidebar desktop, drawer mobile) ready for watch data (issue 30+)
- Placeholder routes: `/app/history`, `/app/voice`, `/app/settings`; `/app/generate` simplified to shell placeholder
- Tests: `tests/web/app-shell-nav.test.ts`; `pnpm test:web` (50) + `apps/web` tsc pass

## 2026-06-12 — Issue 27 complete: Auth0 HITL verified

- User confirmed Auth0 login flow working locally (SPA + API audience, callback on :3000, backend on :3001)

## 2026-06-12 — Restore monorepo backend config (post-landing slim)

- Reverted web-only workspace slim from `bedcaf9`: `pnpm-workspace.yaml` back to `apps/*` + `packages/*` (16 packages)
- Restored root `package.json` scripts (`dev:backend`, `test`, `guardrails:effect`, `showcase:*`, etc.) and workspace devDependencies for governance tests
- Extended `.env.example` with `AUTH_*`, `VITE_API_BASE_URL`; CI switched from npm to pnpm (`build:web` + `test:web`)
- Vercel deploy unchanged (`apps/web/vercel.json` still builds only the web app)

## 2026-06-12 — Issue 27: Auth + SDK foundation (web)

- Wired Auth0 (`@auth0/auth0-react`), `client-sdk`, and Effect runtime layers under `apps/web/src/lib/{auth,runtime,services}/`
- Added protected routes `/app/*`, `/login`, `/callback`; `RequireAuth` redirects unauthenticated users to Auth0
- Smart post-login redirect: no voice examples + incomplete onboarding → `/app/onboarding`; else → `/app/generate` (or deep link when gate cleared)
- `/app/generate` smoke test lists content types via authenticated SDK
- Added unit tests `tests/web/post-login-redirect.test.ts`, `tests/web/content-types-smoke.test.ts`; governance boundary test passes
- Root `package.json`: `vitest` + `test:web` script; `pnpm-workspace.yaml` includes `client-sdk` + `contracts`
- **HITL remaining:** Auth0 tenant env vars (`VITE_AUTH0_*`) and manual login verification; API base URL from `SITE_URL`

## 2026-06-12 — Web v2 issues 27–34

- Added parent [`issue-authenticated-workspace-web-v2.md`](live/prd/issue-authenticated-workspace-web-v2.md) and child issues 27–34 under `docs/live/issues/`
- Updated issues README with Authenticated Workspace section and dependency graph

## 2026-06-12 — Web v2 PRD + phase-2 plan alignment

- Added PRD [`cultiv-authenticated-workspace-web-v2.md`](live/prd/cultiv-authenticated-workspace-web-v2.md) — problem, solution, 34 user stories, acceptance criteria, out of scope
- Rewrote [`phase-2-implementation-plan.md`](live/plan/phase-2-implementation-plan.md) to match grill decisions (async-first, no billing v2, 2-step onboarding, active execution UX)
- Updated [`decisions.md`](live/plan/decisions.md) and PRD/plan README indexes

## 2026-06-12 — Web v2 screen specs (pre-implementation)

- Added [`docs/live/plan/web-v2-screen-specs.md`](live/plan/web-v2-screen-specs.md) — per-screen wireframes, states, SDK fields, i18n namespaces, error mapping

## 2026-06-12 — Web v2 platform structure (grill-with-docs)

- Consolidated **Authenticated Workspace** planning: scope, navigation, async-first generation, Active Execution List/Drawer, Voice Example Composer, dynamic Briefing Form, i18n, quality mode labels, settings
- Updated [`CONTEXT.md`](../CONTEXT.md) with resolved domain terms (Authenticated Workspace, Active Execution List, Voice Example Composer, Quality Mode Presentation, etc.)
- Added [`docs/live/plan/web-v2-platform-structure.md`](live/plan/web-v2-platform-structure.md) — routes, screens, components, SDK map, post-v2 gaps

## 2026-06-11 — Em dash prohibition (generation + copy)

- Added `packages/text-quality/src/quality/em-dash.ts`: detect, penalize, and replace em/en dashes with commas
- Prompt `outputRules`, critic, lexical quality, release gate, humanize/refine, and `sanitize` step enforce the rule
- Replaced em dashes with commas in web i18n, showcase themes, SVG titles, and related scripts/fixtures

## 2026-06-11 — Text generation lexical quality (issues 17–26)

- Unified `OutputWordTarget` in `packages/text-quality` (LinkedIn 130–220; all formats share one module)
- Added domain classifier, `GenerationContext`, prompt policy, step-scoped voice context, minimal adapter payload
- Lexical critic, fidelity anti-copy, `ContentTypeQualityProfile`, release gate; flag `generation.lexicalQualityV2`
- Pipeline catalog: LinkedIn/newsletter/thread `tighten` step; filtered lexicon for non-technical domains
- Regression corpus scaffold in `tests/fixtures/lexical-regression/` + unit tests

## 2026-06-11 — Lexical quality plan broadened to all formats

- PRD/plan/issues updated: program covers all six catalog content types
- Issue 22 generalized to format condensation (LinkedIn + thread + optional newsletter)
- Issue 24 adds `ContentTypeQualityProfile` per format; corpus ≥5 briefings per type

## 2026-06-11 — Text generation lexical quality governance

- Added ADR [`0001-generation-domain-and-lexical-quality.md`](adr/0001-generation-domain-and-lexical-quality.md) — domain classification, unified word targets, lexical gate
- Added PRD [`text-generation-lexical-quality.md`](live/prd/text-generation-lexical-quality.md) and parent issue [`issue-text-generation-lexical-quality.md`](live/prd/issue-text-generation-lexical-quality.md)
- Added implementation plan and tracker under `docs/live/plan/`
- Broke program into issues `17`–`26` in `docs/live/issues/` (`ready-for-agent`)
- Product rule: no technical jargon/names unless generation domain is technical

## 2026-06-11 — Scene copy i18n + issues README

- Added `scenes` namespace to `LocaleMessages`; all typographic scene SVGs read copy from PT/EN catalogs
- Marked issues 09–16 as `done` in `docs/live/issues/README.md`

## 2026-06-11 — Product Showcase restructure (issues 09–16)

- Added `ButtonLink` to `@my-ai-orchestrator/ui`; header/mobile waitlist CTA wired
- Expanded `LocaleMessages` (hero, problem, solutionBreath, differentiators, useCases, productFlow, socialProof); nav `#problema` · `#diferenciais` · `#casos-de-uso` · `#waitlist`
- Rebuilt hero (value H1, subheadline, CTAs, word reveal); new section sequence in `BelowFoldSections`
- Shipped Problem, Solution Breath, Differentiators (pin chapters + LinkedIn teaser), Use Cases, Product Flow, Social Proof
- Removed legacy home sections (`AboutSection`, `FormatsSection`, `ShowcaseSection` carousel) and orphaned i18n/components
- Updated SEO/geo (`llms.txt`, JSON-LD, `cultiv-og.svg`); web tests pass

## 2026-06-11 — Product Showcase visual asset package

- Added `docs/live/web-structure/visual-assets/` — asset bible, 8 reference SVGs (problem scenes, breath layout, differentiator scenes, flow stem, OG)
- Issues 12–15 gated on visual asset approval checklist

## 2026-06-11 — Product Showcase restructure PRD

- Added `docs/live/prd/cultiv-product-showcase-restructure.md` (`ready-for-agent`) — problem/solution narrative, modules, user stories, testing decisions
- Added `docs/live/prd/issue-product-showcase-restructure.md` (`ready-for-agent`) — local tracker issue for implementation
- Indexed in `docs/live/prd/README.md`
- Broke Phase 1.2 into issues `09`–`16` in `docs/live/issues/` (vertical slices, `ready-for-agent`)

## 2026-06-11 — Product Showcase restructure implementation plan

- Added `docs/live/plan/product-showcase-restructure-implementation-plan.md` from grill-with-docs sessions (narrative, UI, motion, i18n, SEO, 5 implementation slices)
- Updated `docs/live/plan/README.md` (Fase 1.2) and `decisions.md` with restructure decisions
- Domain terms captured in `CONTEXT.md` (*Marketing Problem Angle*, *Solution Breath*, *Differentiator Chapter*, etc.)

## 2026-06-11 — Design system reference doc

- Added `docs/live/web-structure/design-system.md` — estrutura do pacote `packages/ui` (tokens, primitives, patterns, integração com `apps/web`)

## 2026-06-11 — Monorepo dev toolchain restored after web-only root slim

- Added `dotenv`, `tsx`, and `typescript` to `apps/backend/package.json` (runtime owner)
- Restored root `devDependencies` for scripts/tests: `tsx`, `effect`, `vitest`, workspace packages, etc.
- Restored root scripts: `dev`, `test`, `showcase:*`, `smoke`, `test:postgres` (direct `tsx scripts/…`, not backend exec)
- Added `build:web` for Vercel-style web-only builds; `build` runs all workspaces again
- Updated README backend quick start and scripts table

## 2026-06-09 — og:site_name meta tag

- Added `og:site_name` (`Cultiv`) to shared `seo()` helper for Open Graph validators

## 2026-06-09 — FAQ accordion layout

- Accordion: removed `max-w-3xl` so questions/answers wrap only at container edge
- Accordion row uses flex `items-center` so index, title, and icon stay on one line; answer indented via invisible index spacer

## 2026-06-10 — Lighthouse performance round 2 (review 3)

- Removed Effect from client bundle (`isWaitlistSuccess` moved to `waitlist-result.ts`)
- Deferred Analytics, GSAP (`requestIdleCallback`), and below-fold sections (IntersectionObserver)
- Split Google Fonts: Inter+Playfair critical, Caveat+JetBrains on idle; `dns-prefetch` + `preconnect`
- `vendor-effect` chunk no longer loads on initial page

## 2026-06-10 — Lighthouse performance optimizations

- Analyzed `lighthouse-review-2.json` (Performance 77, FCP/LCP 3.9s, render-blocking fonts/CSS)
- Lazy-loaded below-fold sections (`BelowFoldSections` chunk ~74 KB)
- Dynamic GSAP runtime (`vendor-gsap` ~111 KB) + deferred Lenis (`requestIdleCallback`)
- Async Google Fonts via inline head script (non-render-blocking)
- Vite `manualChunks` for gsap/lenis/effect; main `index` bundle reduced ~501 KB → ~356 KB

## 2026-06-10 — Dependency cleanup

- Removed stale `package-lock.json` (npm artifact with fastify/better-sqlite3); added to `.gitignore`
- Removed `better-sqlite3` from `pnpm-workspace.yaml` `allowBuilds`
- Removed unused deps: `tailwind-merge` (`apps/web`), `@my-ai-orchestrator/skills` (`packages/text-quality`), `undici-types` (`apps/backend`)
- Updated README stack (Hono-only, no Fastify legacy)

## 2026-06-10 — Vercel deploy fixes

- Root cause: `packages/ui` extends `packages/config/tsconfig/base.json`, which was not in the GitHub repo
- Slimmed root `package.json` for web-only deploy (removes better-sqlite3/Fastify root deps; install ~151 vs ~404 packages)
- Fixed `ShowcaseSampleOutput` TypeScript narrowing for `hiddenParagraphCount`
- Verified Vercel preset build locally with `VERCEL=1`

## 2026-06-09 — README rewrite for GitHub

- Replaced legacy `ai-writing-engine` README with Cultiv monorepo overview, architecture (phases, engine, boundaries), tech stack, design system, quick start, and deploy guide

## 2026-06-09 — Header border on scroll + hero leaf spawn

- Header: bottom border transparent at scroll top, `border-foreground` after ~4px scroll (Lenis-aware)
- Hero falling leaves: random spawn position within viewport, fade in, then fall; new random point each cycle

## 2026-06-09 — Logo palette aligned to design tokens (option A)

- Brand SVGs: circle `showcase` #243830, quill/sprout `moss` #6b9080, veins `showcase-muted` #a8bdb2, ink `golden` #d4a843; wordmark text `foreground` #1e2f2a

## 2026-06-09 — Brand SVG assets integrated

- Public logos: wordmark (header/footer), icon (favicon), full + OG (`cultiv-og.svg`); tagline updated to *Your authenticity, at scale*
- `BrandMark` uses SVG assets; favicon + apple-touch-icon in root head; JSON-LD logo → icon, OG → `cultiv-og.svg`

## 2026-06-09 — Rebrand Cultivated → Cultiv

- Product name, copy (pt/en i18n), legal pages, SEO/GEO defaults, tests, CONTEXT.md, and docs updated
- Domain default: `https://cultiv.app`; contact emails `contato@cultiv.app` / `contact@cultiv.app`
- PRD renamed to `docs/live/prd/cultiv-marketing-surface-phase-1.md`

## 2026-06-09 — Hero slogan rotation

- Hero slogan: anchor + rotating keyword (`autenticidade` / `credibilidade` / `personalidade` / `marca pessoal`) via `HeroRotatingSlogan` with typewriter cycle (type → hold → delete); handwritten note unchanged
- SEO/tagline updated to fixed variant: "Sua autenticidade, em escala." / "Your authenticity, at scale."

## 2026-06-09 — Cultiv web planning (grill-with-docs)

Completed full web implementation planning for phase 1 (Marketing Surface) and preview of phase 2 (`/app`).

Key outcomes:

- Product name: **Cultiv**
- Stack: TanStack Start, Tailwind, GSAP/Lenis, Effect-TS (boundaries), `packages/ui`
- Phase 1: single-scroll showcase + waitlist (Loops), bilingual `/` + `/en`, Vercel deploy
- Phase 2: Auth0 + `client-sdk` + authenticated app shell
- Plan: `docs/live/plan/` (README, decisions, phase-1, phase-2)
- PRD phase 1: `docs/live/prd/cultiv-marketing-surface-phase-1.md` (`ready-for-agent`)
- Issues phase 1: `docs/live/issues/` (8 vertical slices, `ready-for-agent`)
- Issue 01 done: `packages/ui` + `apps/web` TanStack Start scaffold, `pnpm dev:web`
- Issue 02 done: MarketingLayout, header/footer, `/` + `/en`, LocaleToggle
- Issue 03 done: Hero, Proof, Method, FAQ editorial sections + i18n catalogs
- Issue 04 (in progress): Showcase themes + generation guide — thread em cards; blog/linkedin com preview de plataforma; modal toggle; fix billing/consent/batch; HITL copy review still open
- Visual pass: hero com árvore central (`BotanicalTree`) + folhas caindo; folhas esparsas em About/Formats/FAQ; `prefers-reduced-motion` estático
- Mobile pass: menu hamburger (`SiteMobileNav`); showcase empilhado abaixo de `md` com botão de amostra completa; carrossel horizontal só desktop
- Issue 05 done: Privacy and terms pages (`/privacy`, `/terms`, `/en/*`)
- Issue 06 done: Waitlist via `submitWaitlistAction` + `POST /api/waitlist` → Loops; governance excludes server-only paths
- Issue 07 done: Lenis + GSAP ScrollTrigger, scroll reveal/stagger hooks, `motion-hover` utility, reduced-motion guards
- Issue 08 (code complete, HITL pending): SEO + GEO package — JSON-LD (Organization, WebSite, SoftwareApplication, FAQPage, WebPage); `llms.txt` / `llms-full.txt` (pt/en); AI crawler policy in robots; `GeoCitationBlock`; Vercel/Nitro config; tests `seo-meta` + `geo` — awaiting Loops keys, prod deploy, Lighthouse ≥90, DNS smoke test
- UI pass (Glyphs Labs editorial): paper surface, black grid rules, hero decor grid, nav/badge, stat cells, showcase rows, inverted waitlist band, three-column footer
- Glossary updates: `CONTEXT.md` (Marketing Surface, Showcase Sample, Waitlist, Cultiv, etc.)
- Visual system (illustration + typography): Playfair/Caveat/Inter/JetBrains tokens; botanical SVG illustrations with paper grain + stroke-draw/upright animations; `LetterReveal`, `HandwrittenNote`, `StampBadge`, `TypeVine`; integrated across Hero, About, Formats, Showcase, Waitlist sections
