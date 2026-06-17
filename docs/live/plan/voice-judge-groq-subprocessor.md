# Groq subprocessor — Voice Judge

**Scope:** Author Reasoning Signature program (ADR 0006, issue 71).  
**Last updated:** 2026-06-16

## When Groq is used

When `voice.reasoningSignatureV1` is enabled and **Voice Judge** runs (strict quality mode, borderline drift, or finalist tie), the backend may send **generation finalists** and a **minimal reasoning summary** to **Groq** via the `voice-judge-llm` routing profile (`llama-3.3-70b-versatile` preferred).

Groq is **not** used for primary content generation or for offline **Reasoning Extraction** (that path uses `voice-extraction-llm` / Gemini).

## Consent alignment

This processing falls under existing **Voice Training Consent**:

- The user already consented before **Voice Examples** were stored and used to derive voice.
- Judge prompts include excerpts derived from the user's voice material and generated drafts — the same class of data already sent to the primary generation provider.
- Revoking **Voice Training Consent** must continue to block new example ingestion and invalidate derived voice state per the Safety Domain PRD.

## Subprocessor disclosure

| Field | Value |
|-------|-------|
| Subprocessor | Groq, Inc. |
| Purpose | LLM scoring of finalist drafts against author reasoning signature |
| Data categories | Voice-derived reasoning summary, draft text, content-type metadata |
| Region | Per Groq terms / DPA |
| Fallback | Primary provider (e.g. Gemini), then heuristics-only selection |

Product privacy copy and subprocessors list should mention Groq when Voice Judge is enabled in production.

## Operational requirements

| Variable | Required | Notes |
|----------|----------|-------|
| `GROQ_API_KEY` | When judge prefers Groq | Backend secret; never exposed to web |
| `GROQ_BASE_URL` | Optional | Default `https://api.groq.com/openai/v1` |

If `GROQ_API_KEY` is unset or Groq returns 429/5xx, the backend falls back per `voice-judge-llm` policy; generation must not fail solely because judge is unavailable.

## Minimization

- Judge prompts use finalist text and compact reasoning fields — not full historical example corpora.
- Extraction and rebuild logs must not include example body text (existing observability rule).

See also: [production-go-live.md](../runbooks/production-go-live.md) · [reasoning-regression-baseline.md](./reasoning-regression-baseline.md)
