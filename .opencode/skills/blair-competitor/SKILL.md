---
name: blair:competitor
description: Deep competitor research and battle card. Optionally targets a specific competitor by name.
---

# /blair:competitor

Triggered when the user runs `/blair:competitor` — optionally with a competitor name.

Examples:
- `/blair:competitor`
- `/blair:competitor HubSpot`
- `/blair:competitor "the incumbent they always mention"`

---

## Step 1 — Orient

Read `.claude/cmo/brand.md`. If it's missing or has `[NEEDS BRIEF]` in the competitors field: ask who the competitor is before proceeding.

---

## Step 2 — Identify the competitor

If the user named a competitor, use it. If not, ask:

> "Which competitor — the one you lose deals to most often, the one prospects compare you to, or the market leader in the space?"

One question. Wait for the answer.

---

## Step 3 — Research the competitor

Spawn `blair-researcher` with this handoff context:

```
HANDOFF CONTEXT — /blair:competitor
Brand profile: [paste full brand.md]
Competitor: [name]
Task: Deep competitive research on [competitor]. Cover:
0. **First:** Output the **Competitor Fact Table** (full schema in `docs/research-integrity.md`) for this competitor only — then the rest.
1. Their positioning and messaging (pull from their website, homepage, pricing page)
2. Their pricing model and tier structure
3. Customer complaints — G2 reviews, Reddit, Capterra, Twitter/X
4. Their ICP vs. our ICP — where do they overlap, where do they differ?
5. Recent product announcements or pivots (last 6 months)
6. How they position against us (if discoverable)

Use WebSearch and WebFetch. Return structured findings, not a narrative.
Include: citation blocks (URL + date accessed), confidence labels, and a **Gaps / not verified** section. Never invent weaknesses.
```

---

## Step 4 — Verify research shape

Before building the battle card, confirm the researcher output includes:

- **Competitor Fact Table** (mandatory — see `docs/research-integrity.md`)
- **Citations** (URL + date accessed) for major factual claims
- **Confidence** labels where evidence quality varies
- **Gaps / not verified** for anything that could not be confirmed on the public web

If any of those are missing, send the research back to `blair-researcher` with:

> "Add the Competitor Fact Table first (schema in docs/research-integrity.md), then citation blocks, confidence labels, and a Gaps section. Do not invent weaknesses."

---

## Step 5 — Build the battle card

Once research is complete, spawn `blair-sales-enablement` with:

```
HANDOFF CONTEXT — /blair:competitor
Brand profile: [paste full brand.md]
Competitor research: [paste researcher output]
Task: Build a complete battle card for [competitor]. Include:
- Their strengths (be honest — reps who get caught lying lose deals)
- Their real weaknesses (from customer complaints, not assumptions)
- Our advantages against them
- Trap questions that surface their weaknesses naturally
- Winning plays for each scenario (price, features, market share)
- One-line response to "Why not just use [competitor]?"
```

---

## Step 6 — Update brand.md

After the battle card is delivered, update the competitors section of `.claude/cmo/brand.md` with any new intel. Keep it brief — one line per competitor.

---

## Step 7 — Offer next steps

```
Battle card for [competitor] is ready.

Next moves:
- `/blair:headline` — write homepage copy that positions against them without naming them
- `/blair:launch` — if you're ready to make competitive noise in the market
- Ask Blair: "Write objection handlers for [competitor] switchers"
```

---

## Standards

- Battle cards must be honest about competitor strengths. Dishonest positioning backfires in sales.
- Always pull from real customer complaints — G2, Capterra, Reddit. Never invent weaknesses.
- One battle card per session — going deep on one competitor is more useful than shallow on five.
