---
title: Consent Assertion Evidence And Operational Reconstruction
doc_type: issue
status: completed
domain: safety-and-compliance
last_updated: 2026-06-02
---

# Consent Assertion Evidence And Operational Reconstruction

## Parent

- `docs/archive/prd/safety-domain-data-protection-and-llm-guardrails.md`

## What to build

Build the final consent-evidence slice that records reconstructable evidence for
consent assertion outcomes, so the operational read model can explain why a
voice-ingestion or voice-use boundary was blocked without requiring access to
protected voice material.

This slice should prove the end-to-end behavior that:

- consent enforcement at runtime is visible as a first-class policy event
- operational evidence can distinguish grant, revoke, and assert semantics
- blocked consent assertions are reconstructable without introducing noisy raw
  payload retention
- the consent boundary becomes fully observable end-to-end

Implementation scope:

- define the assertion-evidence semantics for `assertConsent`, including whether
  success, block, or both should be recorded
- emit specialized consent evidence from the assertion path with stable
  rationale and summary semantics
- keep retention minimal and aligned with the redaction/read-model rules from
  earlier slices
- add focused tests for operational read-model visibility of assertion outcomes

## User stories covered

- 21, 22, 46, 48, 50, 53

## Acceptance criteria

- [x] The consent boundary records reconstructable evidence for the assertion path according to an explicit policy decision.
- [x] Operational evidence can distinguish consent grant, revoke, and assert outcomes without exposing protected payload content.
- [x] Evidence retention for assertion outcomes remains minimal and redaction-safe.
- [x] Focused tests cover at least one blocked assertion path and its operational read-model visibility.

## Blocked by

- `14-fail-closed-consent-revocation-and-voice-artifact-invalidation.md`
