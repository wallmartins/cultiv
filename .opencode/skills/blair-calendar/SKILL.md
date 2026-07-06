---
name: blair:calendar
description: Build a content calendar. Blair generates a 30, 60, or 90-day publishing plan with specific topics, hooks, formats, and CTAs across all active channels — grounded in the brand's current goal.
---

# Blair: Calendar

Build a specific, executable content calendar — not a generic posting schedule.

## What you get

- **Content pillars** — 3-4 recurring themes tied to your goal and ICP
- **Week-by-week plan** — specific topics, formats, hooks, and CTAs for every publishing day
- **Channel distribution** — content matched to your active channels
- **Strategic arc** — topics sequenced to move the ICP from awareness to conversion over the period

## Usage

```
/blair:calendar          → 30-day calendar (default)
/blair:calendar 60       → 60-day calendar
/blair:calendar 90       → 90-day calendar
```

## Instructions

Check `.claude/cmo/brand.md` first. If it doesn't exist, tell the user to run `/blair:start`.

Also check `.claude/cmo/campaigns.md` — if there's an active campaign, align the calendar to it.

If brand.md exists, determine the timeframe:
- If the user specified a number (30, 60, 90), use it
- If not, default to 30 days

Then spawn `blair-calendar` with:

> Build a [N]-day content calendar for [brand name]. Brand profile is in `.claude/cmo/brand.md`. [Include campaign context if campaigns.md has an active campaign.] Produce the full week-by-week plan with specific topics, hooks, formats, and CTAs. After delivering the calendar, offer to write copy/content for specific pieces.
