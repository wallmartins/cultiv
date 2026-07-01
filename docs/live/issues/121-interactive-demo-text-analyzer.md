---
title: "Interactive Demo: Text Analyzer Logic"
doc_type: issue
status: ready-for-agent
domain: marketing-surface
slice_type: AFK
last_updated: 2026-06-30
---

# Interactive Demo: Text Analyzer Logic

## Parent

- `docs/landing-page-redesign/01-hero-e-demo-interativo.md`

## User stories covered

- Visitante cola um parágrafo e vê suas métricas de escrita em tempo real
- Visitante entende como o produto mede a escrita dele

## What to build

Create a pure client-side text analysis module that extracts 6 writing metrics from any Portuguese or English text. This is the core logic for the interactive demo — no UI, just the analysis function.

This vertical slice proves end-to-end that:

- `apps/web/src/marketing/lib/text-analyzer.ts` exports an `analyzeText(text: string)` function
- Function returns a `DeterministicMetrics` object with 6 fields:
  - `avgSentenceLength` (number): average words per sentence
  - `formalityScore` (number 0-1): estimated formality level
  - `typeTokenRatio` (number 0-1): vocabulary diversity (unique words / total words)
  - `punctuationDensity` (number 0-1): punctuation characters / total characters
  - `avgDependencyDepth` (number): proxy via avg sentence length / 5
  - `certaintyLevel` ('baixa' | 'moderada' | 'alta'): based on certainty markers count
- Function handles empty/short text gracefully (returns defaults or null)
- Function runs in <50ms for texts up to 500 words
- Analysis works for both PT-BR and EN text (marker lists for each language)
- Unit tests cover: normal text, empty text, single word, very long text, mixed languages

## Acceptance criteria

- [ ] `analyzeText()` function exported from `text-analyzer.ts`
- [ ] Returns all 6 metric fields with correct types
- [ ] Handles empty string without throwing
- [ ] Handles single-word input without throwing
- [ ] Handles 500-word input in <50ms (benchmark in test)
- [ ] PT-BR certainty markers: "certamente", "sempre", "nunca", "definitivamente", "claro", "obviamente"
- [ ] EN certainty markers: "certainly", "always", "never", "definitely", "clearly", "obviously"
- [ ] Formality estimation correlates with average word length (longer words = more formal)
- [ ] Type-token ratio correctly calculates unique/total words
- [ ] Unit tests pass with >90% coverage on the module
- [ ] No external dependencies (pure JS/TS, no NLP libraries)

## Blocked by

None — can start immediately.
