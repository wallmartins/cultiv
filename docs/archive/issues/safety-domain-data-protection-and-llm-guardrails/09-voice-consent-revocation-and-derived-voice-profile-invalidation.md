---
title: Voice Consent Revocation And Derived Voice Profile Invalidation
doc_type: issue
status: completed
domain: safety-and-compliance
last_updated: 2026-06-01
---

# Voice Consent Revocation And Derived Voice Profile Invalidation

## Parent

- `docs/archive/prd/safety-domain-data-protection-and-llm-guardrails.md`

## What to build

Build the slice that makes **Voice Training Consent** revocation materially
effective by disabling future use of prior **Voice Example** material,
invalidating the current **Derived Voice Profile**, preventing future reuse of
voice-derived artifacts, and keeping only the minimal compliance residue the PRD
allows.

This slice should prove the end-to-end behavior that:

- revocation changes future backend behavior instead of becoming an advisory flag
- the current derived voice state cannot continue to benefit from revoked
  examples
- the product can explain that new samples are required after revocation without
  leaking historical protected content
- compliance retention remains minimal and intentional

Implementation scope:

- model consent revocation as an explicit lifecycle transition rather than a soft
  boolean flip
- disable future derivation or retrieval of revoked **Voice Example** material
  for voice derivation purposes
- invalidate the current **Derived Voice Profile** and any allowed reuse path
  that still depends on revoked material
- preserve only the minimum required audit or compliance residue instead of
  retaining reusable voice-training content
- ensure future generation behavior reflects the revoked state until the user
  provides new valid voice material under consent

## User stories covered

- 11, 12, 13, 35, 36, 46, 49

## Acceptance criteria

- [x] Revoking **Voice Training Consent** disables future use of stored **Voice Example** material for derivation or voice reuse.
- [x] Revocation invalidates the current **Derived Voice Profile** so future generations do not continue benefiting from revoked material.
- [x] The backend can surface a predictable post-revocation state where fresh voice material is required before voice alignment resumes.
- [x] Only minimal compliance evidence remains after revocation; reusable voice-training content does not stay available through an alternate path.
- [x] Integration tests cover revocation, post-revocation generation behavior, invalidated derived voice state, and fresh re-consent or re-ingestion recovery paths.

## Blocked by

- `08-voice-training-consent-gated-ingestion-and-protected-storage.md`
