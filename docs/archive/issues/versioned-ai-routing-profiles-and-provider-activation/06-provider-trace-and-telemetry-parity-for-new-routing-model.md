---
title: Provider Trace And Telemetry Parity For New Routing Model
doc_type: issue
status: ready-for-agent
domain: ai-implementation
last_updated: 2026-05-26
---

# Provider Trace And Telemetry Parity For New Routing Model

## Parent

- `docs/archive/prd/versioned-ai-routing-profiles-and-provider-activation.md`

## What to build

Build the slice that keeps trace and telemetry parity under the new
**Routing Profile** model, including the selected provider/model path, ordered
attempts, timeout or failure outcomes, and observed provider signals for all
supported providers.

This slice should prove the end-to-end behavior that:

- the final provider/model and ordered attempts are visible in telemetry and
  trace
- Gemini and DeepSeek participate in the same observability contract as the
  existing providers
- support and operations can understand why the final route won

## Acceptance criteria

- [ ] Execution telemetry captures final provider/model and ordered attempt history under the **Routing Profile** model.
- [ ] Trace events expose preferred versus fallback attempt outcomes consistently across all supported providers.
- [ ] Existing preview-to-execution correlation remains compatible with the new routing metadata.

## Blocked by

- `05-fallback-execution-inside-routing-profile.md`
