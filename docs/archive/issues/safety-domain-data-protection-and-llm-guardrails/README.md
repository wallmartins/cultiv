---
title: Safety Domain, Data Protection, And LLM Guardrails Issue Set
doc_type: issue-set
status: in-progress
domain: safety-and-compliance
last_updated: 2026-06-02
---

# Safety Domain, Data Protection, And LLM Guardrails Issue Set

Local issue breakdown derived from:

- `docs/archive/prd/safety-domain-data-protection-and-llm-guardrails.md`

Execution guardrails for all slices:

- follow the `software-engineering` skill guidelines
- follow the `effect-ts` skill guidelines anywhere Effect is used
- follow the `reviewing-code` and `review-delivery` skill guidelines to confirm everything is completely done
- keep the **Safety Domain** as a deep backend-owned module with small, stable interfaces
- model policy decisions, failures, and evidence with typed errors and typed records
- use Effect services and `Layer` composition for scanners, policy stores, redaction, encryption, and audit integrations
- keep external scanning or detection libraries behind adapters and never let them become the canonical policy source
- fail closed on critical paths such as classification, consent, scope enforcement, output release, and override evaluation
- test external behavior at route or service boundaries instead of private implementation details
- preserve the existing voice architecture where **Derived Voice Profile** remains the generation-time voice source of truth
- avoid oversized files by extracting cohesive policy modules early

Issues are ordered so blockers come first.

Proposed slices:

1. **Title**: Safety Policy Foundation And Boot Validation
   **Type**: AFK
   **Blocked by**: None
   **User stories covered**: 30, 32, 37, 40, 41, 48, 53, 55
2. **Title**: Public Input Safety Gateway For Generation Boundaries
   **Type**: AFK
   **Blocked by**: `01-safety-policy-foundation-and-boot-validation.md`
   **User stories covered**: 1, 3, 5, 16, 31, 37, 47, 55
3. **Title**: Instruction Override Attempt Detection And Decisioning
   **Type**: AFK
   **Blocked by**: `01-safety-policy-foundation-and-boot-validation.md`, `02-public-input-safety-gateway-for-generation-boundaries.md`
   **User stories covered**: 2, 21, 22, 51, 52, 53, 54
4. **Title**: Restricted Imported Context Ingestion And Sanitization
   **Type**: AFK
   **Blocked by**: `01-safety-policy-foundation-and-boot-validation.md`, `02-public-input-safety-gateway-for-generation-boundaries.md`, `03-instruction-override-attempt-detection-and-decisioning.md`
   **User stories covered**: 4, 17, 18, 19, 20, 44, 47, 55
5. **Title**: Step Scope Contracts And Handoff Validation
   **Type**: AFK
   **Blocked by**: `01-safety-policy-foundation-and-boot-validation.md`
   **User stories covered**: 14, 30, 33, 34, 45, 53, 55
6. **Title**: Sanitized Generation Input And Runtime Minimization
   **Type**: AFK
   **Blocked by**: `02-public-input-safety-gateway-for-generation-boundaries.md`, `04-restricted-imported-context-ingestion-and-sanitization.md`, `05-step-scope-contracts-and-handoff-validation.md`
   **User stories covered**: 14, 15, 19, 31, 35, 36, 37, 47
7. **Title**: Output Release Gate For Technical And Sensitive Content
   **Type**: AFK
   **Blocked by**: `01-safety-policy-foundation-and-boot-validation.md`, `05-step-scope-contracts-and-handoff-validation.md`, `06-sanitized-generation-input-and-runtime-minimization.md`
   **User stories covered**: 6, 7, 8, 15, 38, 39, 55
8. **Title**: Voice Training Consent-Gated Ingestion And Protected Storage
   **Type**: AFK
   **Blocked by**: `01-safety-policy-foundation-and-boot-validation.md`
   **User stories covered**: 9, 10, 35, 36, 43, 46, 47, 49
9. **Title**: Voice Consent Revocation And Derived Voice Profile Invalidation
   **Type**: AFK
   **Blocked by**: `08-voice-training-consent-gated-ingestion-and-protected-storage.md`
   **User stories covered**: 11, 12, 13, 35, 36, 46, 49
10. **Title**: Policy Evidence Persistence And Operational Read Model
    **Type**: AFK
    **Blocked by**: `02-public-input-safety-gateway-for-generation-boundaries.md`, `03-instruction-override-attempt-detection-and-decisioning.md`, `05-step-scope-contracts-and-handoff-validation.md`, `07-output-release-gate-for-technical-and-sensitive-content.md`, `08-voice-training-consent-gated-ingestion-and-protected-storage.md`, `09-voice-consent-revocation-and-derived-voice-profile-invalidation.md`
    **User stories covered**: 21, 22, 29, 46, 48, 50, 51, 54
11. **Title**: Sensitive Runtime Redaction And Secret-Safe Diagnostics
    **Type**: AFK
    **Blocked by**: `01-safety-policy-foundation-and-boot-validation.md`, `10-policy-evidence-persistence-and-operational-read-model.md`
    **User stories covered**: 19, 42, 43, 47, 50
12. **Title**: Operational Override Policy And Non-Overridable Boundaries
    **Type**: AFK
    **Blocked by**: `03-instruction-override-attempt-detection-and-decisioning.md`, `05-step-scope-contracts-and-handoff-validation.md`, `07-output-release-gate-for-technical-and-sensitive-content.md`, `10-policy-evidence-persistence-and-operational-read-model.md`
    **User stories covered**: 21, 23, 24, 25, 26, 27, 28, 29, 46

Current progress:

- slice `01` is completed and validated
- slice `02` is completed and validated
- slice `03` is completed and validated
- slice `04` is completed and validated
- slice `05` is completed and validated
- slice `06` is completed and validated
- slice `07` is completed and validated
- slice `08` is completed and validated
- slice `09` is completed and validated
- slice `10` is completed and validated
- slice `11` is completed and validated
- slice `12` is completed and validated
- slice `13` is completed and validated
- slice `14` is completed and validated
- slice `15` is completed and validated
- slice `16` is completed and validated
- slice `17` is completed and validated
- slice `18` is completed and validated

Follow-up hardening slices identified after full PRD and delivery review:

- all identified hardening slices are completed and validated

Completed slices:

- `01-safety-policy-foundation-and-boot-validation.md`
  - official backend-owned safety policy manifest and versioned policy document are in place
  - typed policy families, classification taxonomy, decision outcomes, evidence boundaries, and overrideability metadata are loaded through the canonical safety policy service
  - boot validation fails closed with typed errors for missing families, missing classifications, invalid unknown-input handling, and invalid decision contracts
  - focused loader tests and backend build validation are passing
- `02-public-input-safety-gateway-for-generation-boundaries.md`
  - public input safety gateway is implemented as a deep backend module with typed decisions for `approve`, `sanitize`, `quarantine`, and `block`
  - preview and generation public entry points require gateway approval before generation logic or persistence proceeds
  - approved requests cross the boundary only with sanitized input envelopes
  - legacy public routes `/api/run` and `/api/pipelines` also pass through the gateway to avoid bypass
  - route-surface and module tests validate blocked, quarantined, sanitized, fail-closed, and ordinary approved paths
- `03-instruction-override-attempt-detection-and-decisioning.md`
  - instruction override attempts are modeled as typed events and typed verdicts with explicit statuses for `clear`, `observe`, `quarantine`, and `block`
  - the input safety gateway now evaluates override attempts before preview or generation proceeds and fails closed on critical detector failures
  - high-confidence prompt exfiltration and similar override attempts are blocked or quarantined, while lower-confidence signals remain observable without overblocking
  - the override logic is kept behind a detector adapter and the gateway internals were split into smaller cohesive modules to preserve maintainability
  - module, route-surface, and generation-boundary tests are passing alongside backend build validation
- `04-restricted-imported-context-ingestion-and-sanitization.md`
  - imported context now launches as a restricted backend-owned plain-text channel with explicit contract support on preview, public generation, and explicit pipeline requests
  - the input safety gateway evaluates imported context through a stricter policy path with bounded-size enforcement, out-of-scope rejection, markup neutralization, and explicit block/quarantine outcomes for sensitive or prohibited material
  - sanitized imported context is propagated through the generation boundary and explicit pipeline path so only policy-approved plain text can affect downstream execution
  - contract, gateway, route-surface, orchestrator, and runtime tests now cover allowed plain text, oversized payload blocking, markup neutralization, stricter imported-context handling, and explicit-pipeline propagation
  - focused validation and full backend/workspace build checks are passing
- `05-step-scope-contracts-and-handoff-validation.md`
  - step scope is now enforced as explicit runtime metadata, with per-step read and write contracts resolved before execution instead of relying on ambient full-state access
  - a scoped execution boundary now limits visible inputs and state for each step, blocks unauthorized reads and metadata writes, and validates handoff artifacts before they can be consumed by later steps
  - the main generation path continues to consume `voiceProfile` as the derived voice source of truth while raw `voiceExamples` are no longer exposed as ambient pipeline state
  - focused runtime tests now cover permitted scope access, denied ambient reads, denied writes, invalid handoff artifacts, and fail-closed behavior for missing scope contracts
  - regression validation and full backend/workspace build checks are passing
- `06-sanitized-generation-input-and-runtime-minimization.md`
  - the shared runtime now resolves a typed sanitized generation-input envelope before execution and uses it as the sole source for runtime inputs, prompt assembly, and briefing derivation
  - direct execution and preview-confirmed execution both converge on the same minimized runtime payload, while metadata-only request views are used where downstream components still require a `PipelineRequest`
  - prompt assembly now strips runtime metadata from fallback briefing composition, preserving only approved user-derived material plus policy-approved imported context
  - the default generation path continues to use `voiceProfile` as the derived voice source of truth without reintroducing ambient raw `voiceExamples`
  - focused runtime, prompt-assembly, route-surface, and parity tests are passing alongside full workspace build validation
- `07-output-release-gate-for-technical-and-sensitive-content.md`
  - generated output now passes through an authoritative backend release gate before reaching public clients, with explicit typed outcomes for `approve`, `sanitize`, `block`, and `require_override`
  - the release gate evaluates output against the active `output_release` policy family using heuristic scanner adapters for unsafe code and sensitive-data leak detection
  - destructive and exfiltrative code patterns are blocked while harmless technical code examples are allowed, keeping the gate code-aware without overblocking legitimate content
  - prompt echo, hidden instruction leakage, and operational-context leakage are either sanitized when safe cleanup is possible or blocked when the output cannot be made safe without materially changing its meaning
  - release decisions are integrated into the sync execution path after runtime execution and before response release, so idempotency caching and downstream consumers receive only policy-approved output
  - focused output-release-gate tests cover allowed technical output, blocked unsafe code, blocked prompt echo, sanitized-but-releasable output, and fail-closed behavior for invalid policy contracts
- `08-voice-training-consent-gated-ingestion-and-protected-storage.md`
  - voice-example ingestion now requires explicit **Voice Training Consent** before persistence or derivation work can proceed, modeled as a dedicated `VoiceTrainingConsent` domain entity with `granted`, `grantedAt`, `revokedAt`, and `evidenceBoundary` fields
  - a `BackendVoiceConsentService` provides typed `assertConsent`, `getConsentStatus`, `grantConsent`, and `revokeConsent` operations, failing closed when the consent repository or consent state is unavailable
  - the voice lifecycle operations (`createExample`, `updateExample`) and batch operations (`commitBatch`, `autoCommitExpiredBatches`) are gated behind `assertConsent` so absent or revoked consent blocks storage with a typed `BackendVoiceTrainingConsentRequiredError`
  - persisted **Voice Training Input** and consent-sensitive fields are stored through the canonical `voiceTrainingConsents` repository, with a stub PostgreSQL repository introduced for the first security wave
  - the normal generation path continues to use **Derived Voice Profile** as its voice source of truth; raw **Voice Example** material is consumed only inside the voice rebuild and effective-resolution boundaries, not exposed as ambient pipeline state
  - focused voice-training-consent tests cover consent-present ingestion, consent-absent rejection, consent-revocation blocking, fail-closed behavior for repository defects, and generation-path preservation of **Derived Voice Profile**
- `09-voice-consent-revocation-and-derived-voice-profile-invalidation.md`
  - revoking **Voice Training Consent** now materially disables future use of stored **Voice Example** material by removing all voice examples, the current **Derived Voice Profile**, diagnostics, and snapshots for the user
  - the `revokeConsent` operation is modeled as an explicit lifecycle transition that invalidates the current derived voice state rather than a soft boolean flip
  - only minimal compliance evidence remains after revocation: the consent record itself, the audit trail entry, and counts of removed artifacts; reusable voice-training content does not stay available through any alternate path
  - future generation behavior reflects the revoked state because `resolveEffectiveVoice` and the voice rebuild service already check consent status and return `undefined` or skip when consent is absent or revoked
  - integration tests cover revocation, post-revocation generation behavior, invalidated derived voice state, and fresh re-consent or re-ingestion recovery paths
- `10-policy-evidence-persistence-and-operational-read-model.md`
  - specialized **Policy Evidence** records are now persisted for `input`, `scope`, `output`, and `consent` boundaries, each carrying policy version, decision outcome, and boundary-specific metadata
  - a `BackendPolicyEvidenceService` provides typed `recordInputEvidence`, `recordOutputEvidence`, `recordScopeEvidence`, and `recordConsentEvidence` operations, persisting through the canonical **Audit Trail** with minimal payload retention
  - a controlled operational read model (`listOperationalEvidence`) reveals outcome, boundary, actor, timing, and rationale category without exposing raw protected content; it supports filtering by boundary, outcome, actor, resource, and time range
  - evidence recording failures are handled explicitly with `.pipe(Effect.orElse(() => Effect.void))` so critical safety decisions are never silently erased by an evidence persistence defect
  - the **Input Safety Gateway**, **Output Release Gate**, **Step Scope** enforcement, and **Voice Consent** operations are all instrumented to emit policy evidence after decisions are finalized
  - integration tests cover evidence emission for approved input, allowed output, consent grant/revocation, and read-model filtering for each boundary family
- `11-sensitive-runtime-redaction-and-secret-safe-diagnostics.md`
  - runtime redaction is now centralized in a backend-owned redaction service that applies both secret-like field heuristics and typed safety-classification semantics for protected diagnostic payloads
  - logger, observability, audit-trail, and policy-evidence surfaces now flow through redaction-aware helpers so structured runtime metadata cannot leak protected values through serialization
  - protected classified payloads remain diagnosable because the redacted output preserves safe type hints and the original safety classification while removing the sensitive value itself
  - the operational evidence read model now retains `rationaleCategory` and `summary` so operators can understand which boundary failed and why without turning evidence into a secondary raw-content store
  - focused backend redaction tests now cover classified payload redaction, wrapped logger behavior, observability redaction, redacted evidence persistence, and actionable read-model summaries for input, output, scope, and consent failures
- `12-operational-override-policy-and-non-overridable-boundaries.md`
  - operational override is now exposed only on the **Operational API Surface** through dedicated internal routes, with public product routes continuing to ignore administrative-looking flags and remaining subject to normal safety enforcement
  - override requests now require explicit **Platform Admin** role plus `safety.override` permission, an explicit justification, concrete resource scope, declared target boundary, and lifecycle semantics
  - one-shot override is the default granted form, while time-limited overrides are allowed only through the operational-override policy family and expire automatically when their short explicit window closes
  - non-overridable scope violations and protected categories such as `security_sensitive_data`, `llm_prohibited_data`, and `operational_data` are now encoded in the canonical safety policy and rejected even on the operational path
  - accepted and rejected override attempts now emit both **Policy Evidence** under the `override` boundary and dedicated **Audit Trail** records for approval, rejection, consumption, and expiry events
  - focused operational-override tests now cover public-route non-bypass behavior, Platform Admin authorization requirements, one-shot consumption semantics, automatic expiry of time-limited grants, and durable evidence/audit emission for accepted and rejected attempts

Post-validation hardening backlog:

- `IMPLEMENTATION-HARDENING-PLAN.md`
  - coordination guide for the remaining acceptance and scalability work
- `13-voice-training-field-protection-and-protected-persistence.md`
  - `Voice Training Input` persistence now passes through a dedicated backend-owned field-protection boundary before repository storage
  - protected persistence covers both committed `voiceExamples` and staged `voiceExampleBatches` so batch ingestion no longer stores raw voice-training text in plain application form
  - authorized read paths such as voice rebuild and effective voice resolution continue to receive decrypted domain records through a wrapped `DatabaseClient`, keeping the main generation path unchanged
  - protection failures now fail closed at the persistence boundary instead of silently falling back to plain storage
  - focused protection tests cover create, update, batch staging, batch commit, and simulated protection failure, and full workspace validation is passing
- `14-fail-closed-consent-revocation-and-voice-artifact-invalidation.md`
  - consent revocation now enters a blocked `revocation pending` state before cleanup, so future voice reuse is denied even when invalidation cannot complete immediately
  - successful revocation is only persisted after examples, derived profile, diagnostics, and snapshots are all removed without fallback
  - blocked revocation attempts now emit dedicated audit and consent evidence semantics distinct from fully completed revocation
  - fresh consent cannot be granted again while a prior revocation remains incomplete, preventing silent reactivation of retained voice artifacts
  - focused cleanup-failure tests cover examples, profile, diagnostics, and snapshots, and full workspace validation is passing
- `15-complete-step-scope-evidence-and-reconstructable-violations.md`
  - `Step Scope` now records policy evidence for all critical violation paths, including proxy-backed unauthorized reads from scoped `state` and scoped `inputs`
  - invalid handoff artifacts now emit durable `scope` evidence before the boundary fails closed
  - scope-violation evidence emission was consolidated behind a dedicated helper so the runtime boundary no longer duplicates inline evidence writes
  - focused scope tests now validate operational read-model visibility for unauthorized state reads, unauthorized input reads, unauthorized metadata writes, and invalid handoff outcomes
  - full workspace validation is passing
- `16-consent-assertion-evidence-and-operational-reconstruction.md`
  - blocked `assertConsent` paths now emit specialized consent evidence with explicit `assert` semantics instead of remaining invisible operationally
  - the operational read model can now distinguish `grant`, `revoke`, and blocked `assert` consent events without exposing protected voice material
  - assertion evidence remains intentionally minimal and only covers blocked runtime enforcement paths to avoid unnecessary noise
  - focused evidence and consent tests now validate blocked assertion visibility, and full workspace validation is passing
- `17-durable-operational-override-grants-and-restart-safe-lifecycle.md`
  - operational override grants now persist through a backend-owned repository on the canonical database layer instead of process-local in-memory state
  - durable lifecycle state now distinguishes `active`, `consumed`, and `expired`, preserving restart-safe replay semantics for one-shot grants and preventing duplicate expiry emission across instances
  - focused durability tests now cover stored grant persistence, restart-safe one-shot consumption, multi-instance expiry, and audit continuity while keeping non-overridable policy enforcement unchanged
- `18-shared-safety-taxonomy-schemas-and-module-boundary-hardening.md`
  - canonical safety taxonomy schemas now back both policy document validation and internal override route validation instead of maintaining duplicated literal vocabularies
  - `policy-evidence` is now split into recorder and read-model modules, reducing mixed responsibility in the remaining Safety Domain hot path
  - governance coverage now locks the internal override route onto shared taxonomy schemas to reduce future drift risk
