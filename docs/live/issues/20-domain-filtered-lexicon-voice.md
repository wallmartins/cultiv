---
title: Domain-Filtered Lexicon and Voice Hints
doc_type: issue
status: ready-for-agent
domain: text-generation
slice_type: AFK
last_updated: 2026-06-11
---

# Domain-Filtered Lexicon and Voice Hints

## Parent

- [`text-generation-lexical-quality.md`](../prd/text-generation-lexical-quality.md)
- [`issue-text-generation-lexical-quality.md`](../prd/issue-text-generation-lexical-quality.md)

## User stories covered

1, 5

## What to build

Filter voice injection by `GenerationContext.domain`:

- `buildVoiceHints`: when `non-technical`, strip tech tokens from merged lexicon (policy list §5).
- `resolveLexicon` (`voice-rebuild-derivation.ts`): exclude tech terms; cap at 3–5 distinctive tokens.
- `extractLexicon` (`voice-hints.ts`): align stopwords with rebuild; do not append preset when profile lexicon is sufficient.
- `voice-presets.ts`: localize LinkedIn lexicon (remove or translate `insight`, `concrete`, `observation` for pt-BR); add anti-patterns for forced tech metaphors globally on non-tech presets.

Preserve tone, cadence, rules, and examples — only filter **injected lexicon terms**, not author voice character.

## Acceptance criteria

- [ ] Voice profile with tech-heavy examples + career briefing → injected lexicon has no cache/deploy/stack/etc.
- [ ] `architecture-post` + technical briefing → technical lexicon preserved.
- [ ] Tests in `tests/backend/voice-prompt-inputs.test.ts` extended for domain filtering.

## Blocked by

- `18-generation-domain-classifier.md`
