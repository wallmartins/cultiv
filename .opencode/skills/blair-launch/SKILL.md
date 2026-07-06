---
name: blair:launch
description: Coordinated launch kit — strategy, campaign assets, and PR for product or feature launches.
---

# /blair:launch

Triggered when the user runs `/blair:launch` — optionally with a launch type or product name.

Examples:
- `/blair:launch`
- `/blair:launch new feature`
- `/blair:launch Product Hunt`

---

## Step 1 — Orient

Read `.claude/cmo/brand.md`. Check `.claude/cmo/campaigns.md` for any existing launch campaign.

If `brand.md` is missing or has `[NEEDS BRIEF]` in critical fields: spawn `blair-brief` first.

---

## Step 2 -- Diagnose before routing

Ask these two questions before identifying launch type:

> 1. "Is this a valley month (you need this launch to carry the period) or a peak month (you have organic momentum and this launch adds upside)?"

> 2. "Can your existing best-sellers hit your monthly revenue target without this new product?"

Wait for answers. They determine the campaign structure:
- Valley month + no baseline coverage = concentrated launch, protect-the-month pre-step required
- Peak month + strong baseline = launch as upside, lighter campaign structure
- Mixed = treat as valley month to be safe

Then: "What are we launching -- a new product, a feature, a pricing change, or something else?"

---

## Step 3 — Spawn sequentially

A product launch requires coordinated output across multiple specialists. Run in this order:

**Pass 1 — Strategy + Research (parallel):**
Spawn `blair-strategist` and `blair-researcher` simultaneously with this handoff context:

```
HANDOFF CONTEXT — /blair:launch
Brand profile: [paste full brand.md]
Launch type: [what the user specified]
Task for blair-strategist: Define the launch positioning angle — what story makes this launch newsworthy and worth paying attention to? Output a launch messaging framework (one-liner, 3 proof points, primary CTA).
Task for blair-researcher: Surface 3 competitive launches in this space in the last 12 months. What angles did they use? What worked, what flopped?
```

**Pass 2 — Campaign architecture:**
Once Pass 1 is complete, spawn `blair-campaigns` with:

```
HANDOFF CONTEXT — /blair:launch
Brand profile: [paste full brand.md]
Launch type: [type]
Launch messaging framework: [from blair-strategist output]
Competitive context: [from blair-researcher output]
Task: Design a complete launch campaign — pre-launch (1-2 weeks), launch day, and post-launch (1-2 weeks). Cover channels, messaging sequencing, and asset list.
```

**Pass 3 — Assets (parallel):**
Spawn `blair-copy` and `blair-pr` simultaneously:

```
HANDOFF CONTEXT — /blair:launch (to blair-copy)
Brand profile: [paste full brand.md]
Campaign brief: [from blair-campaigns]
Task: Write launch day copy — homepage hero, email announcement subject + body, 3 social posts (LinkedIn, X, one platform-native), and 2 ad headlines for the primary channel.

HANDOFF CONTEXT — /blair:launch (to blair-pr)
Brand profile: [paste full brand.md]
Launch: [type and details]
Task: Write a press release for this launch and 3 journalist pitch angles. Identify the story that's actually news.
```

---

## Step 4 — Deliver a launch kit

Assemble all outputs into a single launch kit summary:

```
# [Brand] Launch Kit — [Date]

## Launch positioning
[One-liner and messaging framework from strategist]

## Campaign plan
[Timeline summary from blair-campaigns — pre/launch/post phases]

## Assets ready
- [ ] Homepage hero copy
- [ ] Email announcement
- [ ] Social posts (LinkedIn, X, [platform])
- [ ] Ad headlines
- [ ] Press release
- [ ] 3 journalist pitch angles

## What to do first
[Single most important action to take in the next 48 hours]
```

---

## Standards

- Do not start a launch campaign without knowing: what's launching, who it's for, and what the one-sentence story is.
- A launch without a story is just an announcement. The story is what gets coverage, sharing, and memory.
- If the user doesn't have PR contacts, note it — and recommend Product Hunt, relevant Slack communities, and newsletter sponsorships as earned-media alternatives.
