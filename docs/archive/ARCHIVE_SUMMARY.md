# Archive Summary - docs/live Retirement

Date: 2026-06-09
Status: All live documentation archived after implementation completion

## What Was Implemented

This archive contains the complete documentation set for the AI writing engine project. All major planned capabilities have been implemented in the codebase.

### 1. Backend Infrastructure (Fully Implemented)

- **Config Bootstrap**: Centralized `config.ts` with `.env` loading for local/test, strict validation for production, fail-fast behavior on missing required keys.
- **Authentication**: Auth0 JWT verification, bearer token parsing, `ApplicationUser` JIT provisioning on first request, `Operator` identity separate from application users.
- **Authorization**: Role-based and permission-based access control, `BackendAuthenticatedActor` with explicit 401/403 semantics.
- **Production Hardening**: Health/readiness checks, rate limiting, CORS, security headers, database readiness validation, auth profile warming.
- **Database**: PostgreSQL support via Kysely, explicit SQL migrations, in-memory database for testing, schema version validation on boot.
- **Audit Trail**: Persisted audit records written in the same transaction as sensitive changes.
- **Error Handling**: Typed error taxonomy with consistent response shapes across the public API.

### 2. AI and Execution (Fully Implemented)

- **Voice Profile**: Full lifecycle including examples, batches, effective voice resolution, snapshot persistence, diagnostics, confidence scoring, and adaptation modes.
- **Content Types**: Catalog with discovery, content-type presets, pipeline resolution from product rules.
- **Execution Runtime**: Shared sync/async execution path, quality lanes (fast/balanced/strict), pipeline orchestration, candidate selection.
- **Provider Transport**: Real transport for OpenAI, Anthropic, Gemini, DeepSeek, Ollama with fallback attempts, timeout handling, token tracking.
- **AI Policy**: Versioned policy resolution with manifest files, pricing envelope resolution, step execution rules, provider/model selection.
- **Generation Preview**: Non-reserving preview with pricing snapshot, recommendation, quote consistency validation, projected balance.
- **Billing**: Credit-based billing with reservation, capture, release, ledger, wallet, subscriptions, top-ups, idempotency, plan versioning.
- **Safety Domain**: Input safety gateway, output release scanner, instruction override detection, step scope enforcement, voice consent management.
- **Observability**: Execution traces with provider/model selection, billing correlation, preview recommendation divergence, token usage.

### 3. Client SDK (Fully Implemented)

- **Client Integration Surface**: Framework-agnostic TypeScript SDK with Effect primary API and `toPromise` helper.
- **Domain Modules**: `preview`, `executions`, `voice`, `contentTypes` with flat method structure.
- **Execution Watch**: SSE-based observation with polling fallback, bounded reconnect (5 attempts), typed transitions (started/progressed/completed/failed).
- **Transport**: Auto-generated idempotency keys, AbortSignal support, differentiated retry policies (GET vs POST), typed error handling.
- **Contract Alignment**: Fail-fast on contract drift, shared `packages/contracts` as source of truth.

### 4. Contracts and Shared Libraries (Fully Implemented)

- **packages/contracts**: Request/response schemas and decoders for all public API endpoints.
- **packages/payments**: Billing service with credit policy, plans, entitlements, reservations, captures, releases.
- **packages/database**: Repository layer for users, jobs, voice, content types, audit, with PostgreSQL and in-memory implementations.
- **packages/orchestrator**: Job coordination, pipeline execution.
- **packages/text-quality**: Quality lane selection, candidate normalization, scoring, selection.
- **packages/ai-adapters**: Provider adapter abstraction for multiple LLM backends.
- **packages/core**: Shared primitives, runtime config, logging, context management.

### 5. Tests (Comprehensive)

- 42+ backend test files covering auth, config, execution, voice, billing, policy, safety, audit, parity, contracts, production hardening.
- Integration tests for the public API surface.
- Contract parity tests ensuring schema alignment between backend and SDK.

### 6. Documentation (Complete)

- **29 ADRs**:  Architecture decisions covering billing, auth, database, client SDK, API surfaces, deployment, migrations, audit.
- **API Reference**: Full backend API contract documentation with request/response shapes.
- **Architecture**: System-level architecture overview.
- **Designs**: Client SDK design document with API shapes, transport behavior, error taxonomy.
- **Plans**: Roadmaps for AI implementation, backend production readiness, billing, client SDK cleanup.
- **Policies**: Billing model, AI operational policy, quality billing policy.
- **PRDs**: Product requirements for backend production readiness, client SDK, safety domain, AI routing.
- **Indexes**: AI implementation index as the main entry point.
- **Issues**: Structured backlog by workstream.
- **Reference**: Deployment guide, examples, project documentation.
- **UI**: Color palette, design system, UX design.

## Archive Organization

The archive is organized by document type at the root level. This structure makes it easy to move future retired docs directly into the right folders without intermediate wrapper directories.

- `adr/` - Architectural Decision Records (0001-0028 + effect-ts-hardening)
- `api/` - Backend API reference and internal policy activation
- `architecture/` - System architecture overview
- `designs/` - Client SDK design document
- `indexes/` - AI implementation index
- `issues/` - Backlog issues by workstream
- `plans/` - Implementation plans and roadmaps (merged with previously archived plans)
- `policies/` - Operational policies
- `prd/` - Product requirement documents
- `reference/` - Deployment, examples, project docs
- `ui/` - UI/UX documentation
- `README-live-docs.md` - Original live docs index and conventions

## Retirement Reason

All documented capabilities have been implemented and tested. The live docs served as the active planning and decision record during the implementation phase. With the codebase now stable and production-ready, these documents are preserved in the archive for historical reference, audit, and future onboarding.

New documentation should be created for future features rather than maintaining these as "live" documents.
