---
title: Generation Domain Classifier
doc_type: issue
status: ready-for-agent
domain: text-generation
slice_type: AFK
last_updated: 2026-06-11
---

# Generation Domain Classifier

## Parent

- [`text-generation-lexical-quality.md`](../prd/text-generation-lexical-quality.md)
- [`issue-text-generation-lexical-quality.md`](../prd/issue-text-generation-lexical-quality.md)

## User stories covered

1, 2, 5, 8

## What to build

Implement `classifyGenerationDomain(briefing, contentType, topic?)` returning:

```typescript
type GenerationDomain = "non-technical" | "technical" | "mixed";

interface DomainProfile {
  readonly domain: GenerationDomain;
  readonly confidence: "high" | "medium" | "low";
  readonly signals: readonly string[];
  readonly allowTechnicalLexicon: boolean;
  readonly allowTechMetaphors: boolean;
}
```

**v1:** deterministic heuristics + content-type defaults.

- `architecture-post`, `validation-post` → `technical`
- `linkedin-post`, `newsletter` → `non-technical` unless briefing contains tech signals
- Tech signal list from implementation plan §5

Introduce `GenerationContext` (domain + word target) resolved once in `quality-candidate-selection.ts` and passed into skills.

**v2 (optional in this issue or follow-up):** LLM classify step when `qualityMode === "strict"` and confidence is `low`.

## Acceptance criteria

- [ ] Module lives in `packages/text-quality/src/domain/` (or agreed shared location per ADR).
- [ ] 20+ unit tests (pt-BR and en): career/learning briefings → `non-technical`; API design briefing → `technical` or `mixed`.
- [ ] `architecture-post` never classified as `non-technical`.
- [ ] `GenerationContext` available to `createBackendSkillDefinition` and quality pipeline.

## Blocked by

- `17-unified-output-word-target.md`
