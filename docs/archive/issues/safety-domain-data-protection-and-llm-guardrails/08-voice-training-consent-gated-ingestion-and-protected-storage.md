---
title: Voice Training Consent-Gated Ingestion And Protected Storage
doc_type: issue
status: ready-for-agent
domain: safety-and-compliance
last_updated: 2026-06-01
---

# Voice Training Consent-Gated Ingestion And Protected Storage

## Parent

- `docs/archive/prd/safety-domain-data-protection-and-llm-guardrails.md`

## What to build

Build the slice that makes **Voice Training Consent** an explicit prerequisite
for storing or using **Voice Example** material, while introducing backend-owned
protection for the first wave of persisted voice-training data and keeping the
main generation path anchored on **Derived Voice Profile**.

This slice should prove the end-to-end behavior that:

- voice-example ingestion is rejected when explicit consent is absent
- consent-sensitive content is classified and stored under stronger protection
  than ordinary generation input
- raw **Voice Example** access remains tightly limited to explicitly authorized
  stages
- the existing voice architecture is preserved instead of broadening raw-example
  usage in generation

Implementation scope:

- model explicit consent state and consent verification as part of the
  voice-example ingestion boundary
- ensure storage of **Voice Training Input** requires successful consent policy
  evaluation before persistence proceeds
- apply backend-owned protection to stored voice-example material and selected
  consent-sensitive fields, with infrastructure encryption treated as
  complementary rather than sufficient on its own
- limit the surfaces that can read raw **Voice Example** material and ensure the
  normal generation path continues to use **Derived Voice Profile**
- produce typed consent or storage failures when protection or consent checks
  cannot be completed

## User stories covered

- 9, 10, 35, 36, 43, 46, 47, 49

## Acceptance criteria

- [ ] Voice-example storage and derivation entry points require explicit **Voice Training Consent** before persistence or derivation work can proceed.
- [ ] Persisted **Voice Training Input** and selected consent-sensitive fields receive backend-owned protection in the first security wave.
- [ ] Raw **Voice Example** material remains unavailable to the normal generation path, which continues to use **Derived Voice Profile** as its voice source of truth.
- [ ] Consent-check or protection failures fail closed instead of silently storing sensitive material in a weaker path.
- [ ] Integration tests cover consent-present ingestion, consent-absent rejection, protected persistence behavior, and generation-path preservation of **Derived Voice Profile**.

## Blocked by

- `01-safety-policy-foundation-and-boot-validation.md`
