---
name: blair:headline
description: 10 headline variations for any surface — homepage, pricing page, ads, or cold email subject lines.
---

# /blair:headline

Triggered when the user runs `/blair:headline` — optionally with a specific surface or context.

Examples:
- `/blair:headline`
- `/blair:headline homepage`
- `/blair:headline pricing page`
- `/blair:headline cold email subject lines`
- `/blair:headline LinkedIn ad`

---

## Step 1 — Orient

Read `.claude/cmo/brand.md`. If it's missing or lacks positioning/ICP data, spawn `blair-brief` first.

---

## Step 2 — Identify the surface

If the user specified where the headline goes, use it. If not, ask:

> "Where does this headline live — homepage hero, pricing page, email subject line, ad, or somewhere else?"

One question. The surface changes everything about what works.

---

## Step 3 — Spawn blair-copy

Pass this handoff context:

```
HANDOFF CONTEXT — /blair:headline
Brand profile: [paste full brand.md]
Surface: [homepage / pricing / email subject / ad / other]
Task: Write 10 headline variations for this surface. Cover:
- 3 outcome-led (what the customer gets)
- 3 problem-led (pain they're escaping)
- 2 positioning-led (why this, not the alternative)
- 2 curiosity-led (surprising claim or reframe)

For each headline, add one line explaining why it works — the specific hook or mechanism.

Then recommend your top 3 with rationale: which to test first and why.
```

---

## Step 4 — A/B test guidance

After delivering the 10 headlines, add:

```
## How to test these

**If you have a landing page:**
Test the top 2 headline types — outcome vs. problem-led. Run each for at least 500 visitors or 2 weeks before drawing conclusions.

**If you're testing email subjects:**
Send each variant to ~20% of your list. Measure opens at 24 hours. Winner gets the remaining 60%.

**What a winning headline looks like:**
- 30%+ lift in CTR or open rate vs. control
- Qualitative signal: prospects use its language on calls
- It attracts your ICP, not everyone
```

---

## Standards

- 10 options is the minimum to find 1 great one. Never deliver fewer.
- Headlines that avoid the product category entirely often outperform those that name it.
- If brand.md has hard bans in the voice section, check every headline — banned language disqualifies the option.
- Subject line rules differ from ad headline rules differ from homepage rules. Context is not optional.
