---
title: Billing Model Issues
doc_type: issue-backlog
status: active
domain: billing
last_updated: 2026-05-16
---

# Billing Model Issues

Source: [billing-model-implementation-plan.md](../plans/billing-model-implementation-plan.md)

## 1. Billing policy versioned contract

- **Type:** AFK
- **Blocked by:** None
- **User stories covered:** como operador, consigo definir créditos por `planTier + qualityMode`; como auditor, consigo congelar a policy por `policyVersion`; como sistema, consigo reservar crédito antes da geração.

### What to build

Make billing policy explicit in `packages/payments`, with a versioned policy contract that resolves credit cost from `BillingPlanTier + QualityMode`, includes `policyVersion`, and supports registration/resolution of the current policy version.

### Acceptance criteria

- [ ] `packages/payments` exposes a policy type for `planTier + qualityMode`.
- [ ] Plan definitions carry `policyVersion`.
- [ ] Credit cost resolution is deterministic and testable.
- [ ] The current policy version can be resolved from the billing package.

## 2. Plan policy bootstrap and retirement

- **Type:** AFK
- **Blocked by:** Issue 1
- **User stories covered:** como operador, consigo publicar uma nova policy sem reescrever execuções antigas; como auditor, consigo manter histórico de cobrança por versão.

### What to build

Persist versioned plans in the database, seed sane defaults at bootstrap, and retire old plan records for new signups while keeping historical records available for replay and audit.

### Acceptance criteria

- [ ] Default plans are seeded with `policyVersion`.
- [ ] A new plan/policy version can be created without mutating the previous one.
- [ ] Retired plans remain queryable for historical billing.
- [ ] Existing executions continue to reference the policy version they started with.

## 3. Runtime policy resolution for generation

- **Type:** AFK
- **Blocked by:** Issue 1
- **User stories covered:** como sistema, consigo escolher provider/model por `planTier + qualityMode`; como operador, consigo limitar o envelope de modelos por plano.

### What to build

Resolve the billing policy in the backend before generation starts, and use it to determine the provider/model envelope for the current run.

### Acceptance criteria

- [ ] The backend resolves policy before execution starts.
- [ ] Provider/model choice is derived from `planTier + qualityMode`.
- [ ] Authorization and telemetry record the resolved provider/model.
- [ ] Routes no longer decide provider/model selection directly.

## 4. Real LLM transport for sync and async

- **Type:** AFK
- **Blocked by:** Issue 3
- **User stories covered:** como desenvolvedor, consigo debugar output real; como sistema, consigo validar qualidade e custo com chamadas efetivas à LLM.

### What to build

Replace the synthetic adapter transport with a real provider transport, starting with one OpenAI-compatible provider, while keeping sync and async on the same execution runtime.

### Acceptance criteria

- [ ] The adapter makes a real provider call.
- [ ] Sync and async both use the same transport path.
- [ ] Provider request and response normalization are in place.
- [ ] The output can be debugged against an actual model response.

## 5. Execution policy metadata and traceability

- **Type:** AFK
- **Blocked by:** Issues 2 and 3
- **User stories covered:** como auditor, consigo reproduzir uma execução pelo `policyVersion`; como operador, consigo ver qual provider/model foi usado.

### What to build

Propagate `policyVersion`, provider, and model into execution metadata, trace, and job payloads so the chosen policy snapshot is visible everywhere it matters.

### Acceptance criteria

- [ ] `policyVersion` is present in execution metadata.
- [ ] The selected provider/model is preserved in trace/job payloads.
- [ ] Sync and async report the same policy snapshot shape.
- [ ] Historical executions can be audited without guessing the active policy.

## 6. Routing and billing regression coverage

- **Type:** AFK
- **Blocked by:** Issues 1-5
- **User stories covered:** como time de engenharia, consigo evitar regressão em cobrança e roteamento; como QA, consigo validar sync/async com provider real.

### What to build

Add regression coverage for billing policy resolution, credit reservation/capture, provider/model routing, and sync/async execution against the same policy snapshot.

### Acceptance criteria

- [ ] Credit reservation and capture follow the expected policy.
- [ ] Policy changes create a new version instead of mutating the old one.
- [ ] Sync and async carry the same policy snapshot.
- [ ] A real provider call is covered by tests.

## Recommended order

1. Issue 1
2. Issue 2
3. Issue 3
4. Issue 4
5. Issue 5
6. Issue 6
