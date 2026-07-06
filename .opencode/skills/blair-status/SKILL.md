---
name: blair:status
description: Current state-of-play for the active brand — what Blair knows, what has been done, and what is next.
---

# /blair:status

Triggered when the user runs `/blair:status`.

Produces a brief state-of-play for the current brand — what Blair knows, what's been done, and what's next. Useful at the start of any session to re-orient without re-reading everything.

---

## Step 1 — Resolve active brand

Check `.claude/cmo/active-brand`. If it exists, read the slug and load from `.claude/cmo/brands/[slug]/`. Otherwise use `.claude/cmo/brand.md`.

If no brand profile exists at all:
```
No brand profile found. Run /blair:start to set up Blair.
```
Stop here.

---

## Step 2 — Read all three state files

Read in parallel:
1. **brand.md** — the brand profile
2. **campaigns.md** — the campaign log (if it exists)
3. **insights.md** — the analytics log (if it exists)

---

## Step 3 — Produce the status summary

```
# Blair Status — [Brand Name]
*[today's date]*

---

## What Blair knows about this brand

- **Product:** [one-liner from brand.md]
- **ICP:** [primary ICP summary — one sentence]
- **Priority:** [current marketing priority]
- **Channels:** [active channels]
- **Voice:** [3 adjectives + reference brand]
[If any [NEEDS BRIEF] fields exist: "⚠️ Missing: [field list] — run /blair:start to fill gaps."]
[If any [ASK WHEN NEEDED] fields exist: "📋 Deferred: [field list] — Blair will ask when needed."]

---

## Campaign history

[If campaigns.md has entries:]
| Campaign | Type | Objective | Status |
|---|---|---|---|
[one row per entry from campaigns.md]

[If no entries:]
No campaigns designed yet.

---

## Performance insights

[If insights.md has entries:]
[2-3 bullet points from the most recent performance review entry]

[If no entries:]
No performance reviews yet.

---

## Suggested next move

[Based on the current priority in brand.md, suggest one specific action:]
- Priority is acquisition → "Run /blair:audit on your homepage, or /blair:campaign to build an acquisition campaign."
- Priority is awareness → "Run /blair:calendar for a 30-day content plan, or /blair:swot to find your best angle."
- Priority is retention → "Run /blair:email-sequence welcome to build an onboarding flow."
- Priority is revenue → "Run /blair:competitor to build a battle card, or ask Blair for sales enablement materials."
- No priority set → "Run /blair:strategy to define your current marketing focus."
```

---

## Standards

- Read-only. Never modify any file.
- If files are partially written or malformed, show what's available and note what's missing.
- Keep the summary tight — this is an orientation tool, not a deep analysis. The user can ask for depth after orienting.
