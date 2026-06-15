---
title: Lexical Critic and Fidelity Scoring
doc_type: issue
status: ready-for-agent
domain: text-generation
slice_type: AFK
last_updated: 2026-06-11
---

# Lexical Critic and Fidelity Scoring

## Parent

- [`text-generation-lexical-quality.md`](../prd/text-generation-lexical-quality.md)
- [`issue-text-generation-lexical-quality.md`](../prd/issue-text-generation-lexical-quality.md)

## User stories covered

3, 4, 7

## What to build

**New `lexical-quality.ts`:**
- `typeTokenRatio(text)`
- `topTermConcentration(text)` — exclude stopwords
- `repeatedBigrams(text, threshold)`
- `hookBodyOverlap(hook, body)`
- `countTechTermHits(text, domain)` — uses policy term list when `non-technical`

**`critic.ts` updates:**
- Expand `hasRedundantRepetition` to ≥3 spaced occurrences of same lemma.
- Wire lexical metrics; raise severity for high concentration / tech hits.
- Pass `DomainProfile` into `criticizeText`.

**`fidelity.ts` updates:**
- Penalize verbatim briefing phrase overlap (n-grams or sentence match).
- Content-word overlap with cap; expanded stopwords.

**`driftsFromVoiceMarkers`:** detect real features (first-person, short paragraphs) instead of literal marker strings.

## Acceptance criteria

- [ ] Text with “cache” 3× on non-tech briefing → critic score below selection threshold in unit test.
- [ ] Fidelity no longer maxes out when candidate copies briefing sentences verbatim.
- [ ] Unit tests per metric function.

## Blocked by

- `17-unified-output-word-target.md`
- `18-generation-domain-classifier.md`
