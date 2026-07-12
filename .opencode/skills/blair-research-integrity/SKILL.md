---
name: blair:research-integrity
description: Run competitive or market research with mandatory Competitor Fact Table, citations, and gaps. Use before battle cards or outbound that names real companies.
---

# /blair:research-integrity

Triggered when the user runs `/blair:research-integrity` with a competitor name, company list, or research topic.

Examples:

- `/blair:research-integrity HubSpot`
- `/blair:research-integrity "our top three competitors in sales intelligence"`
- `/blair:research-integrity market size for AI SDR tools in North America`

---

## Step 1 — Orient

Read `.claude/cmo/brand.md`. If missing, tell the user to run `/blair:start` first.

---

## Step 2 — Clarify scope (one question if needed)

If the user did not name a competitor or topic, ask:

> "What should I research with full integrity checks — one named competitor, a list, or a market/audience question?"

Wait for the answer.

---

## Step 3 — Spawn blair-researcher

Invoke `blair-researcher` with this handoff:

```
HANDOFF — /blair:research-integrity
Brand profile: [paste full brand.md]
User request: [verbatim]
Task: Research integrity run. You MUST:
1. Follow docs/research-integrity.md in the Blair repo.
2. For each named competitor: output the Competitor Fact Table FIRST (schema in that doc), then the full structured research brief.
3. Use WebSearch and WebFetch — no facts from memory alone.
4. Include Gaps / not verified and confidence on every non-obvious claim.
```

---

## Step 4 — Deliver

After the brief returns:

1. Print one line: `Research integrity: PASS (Fact Table + gaps in brief)` — or `NEEDS_RESEARCH` if tools failed and only hypotheses remain.
2. Offer the next step: `/blair:competitor` (battle card), `/blair:strategy`, or `/blair:cold-outbound` (if no unverified competitor claims will be asserted).

---

## Standards

- This command exists so **battle cards and outbound** can depend on a verified Fact Table without skipping steps.
- If the user only needs quick copy with no competitor facts, `/blair:research` is enough; use this when **trust bar** is high.
