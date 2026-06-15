---
title: Lexical Release Gate and Candidate Selection
doc_type: issue
status: ready-for-agent
domain: text-generation
slice_type: AFK
last_updated: 2026-06-11
---

# Lexical Release Gate and Candidate Selection

## Parent

- [`text-generation-lexical-quality.md`](../prd/text-generation-lexical-quality.md)
- [`issue-text-generation-lexical-quality.md`](../prd/issue-text-generation-lexical-quality.md)

## User stories covered

1, 4, 7

## What to build

**`lexical-release-gate.ts`:**
- `authorizeLexicalOutput(text, context)` → pass | reject with reasons
- Reject when: tech hits on `non-technical`; top-term concentration over threshold; critical repetition

**Integration in `quality-candidate-selection.ts`:**
- `strict`: re-roll lane once on reject, then fail
- `balanced`: re-roll once
- `fast`: apply score penalty only

**`ContentTypeQualityProfile`** (new config module, all catalog types):

| Content type | Critic weight | Fidelity weight | Lexical gate | Notes |
|--------------|---------------|-----------------|--------------|-------|
| `linkedin-post` | high | medium | strict on non-tech | short social |
| `twitter-thread` | high | medium | strict on non-tech | short social |
| `newsletter` | medium | medium | strict on non-tech | narrative |
| `long-form-blog` | medium | high | strict on non-tech briefing | long |
| `architecture-post` | medium | high | repetition only | tech allowed |
| `validation-post` | medium | high | repetition + fidelity | evidence-first |

**`candidate-selector.ts`:** apply profile weights in `scoreCandidate`; tie-break toward higher lexical diversity among near-equal scores.

**Config:** `generation.lexicalQualityV2` feature flag per content type.

## Acceptance criteria

- [ ] Strict mode does not release output with tech hits on non-technical fixture briefings.
- [ ] Re-roll rate logged; document expected < 15% in tracker.
- [ ] Flag off → legacy behavior unchanged (regression safety).

## Blocked by

- `23-lexical-critic-fidelity.md`
