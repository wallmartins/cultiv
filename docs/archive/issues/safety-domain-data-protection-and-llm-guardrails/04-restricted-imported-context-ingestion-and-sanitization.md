---
title: Restricted Imported Context Ingestion And Sanitization
doc_type: issue
status: ready-for-agent
domain: safety-and-compliance
last_updated: 2026-06-01
---

# Restricted Imported Context Ingestion And Sanitization

## Parent

- `docs/archive/prd/safety-domain-data-protection-and-llm-guardrails.md`

## What to build

Build the launch slice for **Imported Context** so the product can accept a
restricted plain-text supporting-input channel with bounded size, stronger
classification than ordinary briefing input, markup neutralization, and explicit
policy outcomes before imported material is allowed to affect generation.

This slice should prove the end-to-end behavior that:

- imported supporting material launches only in the narrow plain-text form
  allowed by the PRD
- imported text is treated as more dangerous than ordinary briefing input
- dangerous HTML, scripts, or executable markup are neutralized or blocked
  before downstream rendering or model use
- prohibited or overly sensitive imported content is blocked instead of flowing
  into generation on a best-effort basis

Implementation scope:

- add a dedicated imported-context policy path inside the gateway rather than
  treating imported text as just another briefing field
- enforce bounded plain-text size and reject richer or more permissive formats
  that the PRD marked out of scope
- classify imported content against personal, confidential, security-sensitive,
  and LLM-prohibited classes with deny-by-default behavior
- run sanitization that neutralizes executable or rendering-dangerous markup and
  ensures the downstream envelope contains only permitted plain text
- feed imported-context decisions through the same typed decision and evidence
  vocabulary used by the broader **Safety Domain**

## User stories covered

- 4, 17, 18, 19, 20, 44, 47, 55

## Acceptance criteria

- [ ] The product accepts **Imported Context** only as bounded plain text in the launch slice and rejects richer formats that are out of scope.
- [ ] Imported material is evaluated by a stricter policy path than ordinary briefing input and can be sanitized, quarantined, or blocked independently.
- [ ] Dangerous HTML, scripts, or executable markup are neutralized before imported content can affect generation or downstream display.
- [ ] Prohibited or over-broad sensitive imported content is blocked explicitly instead of being passed to the model on a best-effort basis.
- [ ] Integration tests cover allowed plain text, bounded-size enforcement, markup neutralization, and blocked prohibited content.

## Blocked by

- `01-safety-policy-foundation-and-boot-validation.md`
- `02-public-input-safety-gateway-for-generation-boundaries.md`
- `03-instruction-override-attempt-detection-and-decisioning.md`
