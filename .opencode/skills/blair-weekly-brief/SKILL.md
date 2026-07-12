---
name: blair:weekly-brief
description: Monday morning CMO brief — what shipped last week, what's performing, what to prioritize this week. Proactive, not reactive.
---

# /blair:weekly-brief

Triggered when the user runs `/blair:weekly-brief`.

The weekly brief is your CMO standup. It reads everything Blair knows, synthesizes what happened, and tells you what to do this week. You don't have to think about where to start — Blair tells you.

---

## Execution

**Step 1: Read all log files silently**

Read in order:
1. `.claude/cmo/brand.md` — current goal
2. `.claude/cmo/campaigns.md` — what campaigns are active or recently completed
3. `.claude/cmo/pipeline.md` — outbound sequences and their status
4. `.claude/cmo/insights.md` — last performance review
5. `.claude/cmo/learnings.md` — corrections and brand preferences

**Step 2: Ask for last week's numbers (optional)**

> "Do you have any numbers from last week to add — traffic, leads, email stats, pipeline updates? Paste anything you have. If you don't, I'll work with what's in the logs."

Wait for their response. If they say skip or don't respond, proceed without data.

**Step 3: Produce the brief**

Invoke `blair-analytics` with this handoff:

```
## Blair Handoff — Weekly Brief

### Brand Profile
[full contents of .claude/cmo/brand.md]

### Task
Produce a weekly CMO brief. Format as follows:

---

# Weekly Marketing Brief — [week of date]

## What shipped last week
[From campaigns.md and pipeline.md — what launched, what went live, what was completed]
- If nothing logged: "Nothing logged this week — run /blair:status to set a baseline."

## What's active right now
[Campaigns, sequences, or content initiatives currently running]
- Status for each: On track / Needs attention / Stalled

## Performance snapshot
[From insights.md or data provided — 3-5 key metrics, flagged green/yellow/red]
- [Metric]: [value] [🟢/🟡/🔴]

## The constraint this week
[One sentence: where is the pipeline breaking — awareness, leads, conversion, or retention?]

## Top 3 priorities for this week
1. [Specific action — which Blair command to run, what to build or fix]
2. [Specific action]
3. [Specific action]

## One thing to kill or pause
[Anything in the logs that isn't working and should stop — or "Nothing flagged" if clean]

---

### Campaign History
[contents of .claude/cmo/campaigns.md]

### Pipeline Log
[contents of .claude/cmo/pipeline.md]

### Last Insights
[contents of .claude/cmo/insights.md]

### User Data (this week)
[any data the user provided, or "none provided"]
```

**Step 4: After delivery**

Append a brief summary to `.claude/cmo/insights.md`:

```markdown
## Weekly Brief — [date]
- **Constraint:** [one sentence from the brief]
- **Top priority:** [priority #1]
- **Active campaigns:** [count]
```
