---
name: blair:swot
description: Marketing SWOT analysis with strategic synthesis, optionally focused on a competitor or planning cycle.
---

# /blair:swot

Triggered when the user runs `/blair:swot` — optionally with a focus area or competitor.

Examples:
- `/blair:swot`
- `/blair:swot vs HubSpot`
- `/blair:swot Q3 planning`
- `/blair:swot go-to-market`

---

## Step 1 — Orient

Read `.claude/cmo/brand.md`. If it's missing or has `[NEEDS BRIEF]` in critical fields: spawn `blair-brief` first.

Also read `.claude/cmo/campaigns.md` and `.claude/cmo/insights.md` if they exist — prior campaigns and performance data sharpen the analysis.

---

## Step 2 — Research before analyzing

Spawn `blair-researcher` with this handoff context:

```
HANDOFF CONTEXT — /blair:swot
Brand profile: [paste full brand.md]
Focus: [what the user specified, or "full marketing SWOT"]
Task: Research the external environment to inform a marketing SWOT.
1. Market trends — what's accelerating or decelerating in this category?
2. Competitor moves — what are the top 3 competitors doing in the last 6 months?
3. Channel opportunities — any emerging channels or tactics working for similar companies?
4. Threats — new entrants, macro headwinds, regulatory or platform risk?

Use WebSearch and WebFetch. Return structured findings organized by SWOT quadrant (external factors only — Opportunities and Threats). Internal factors come from brand.md.
```

---

## Step 3 — Build the SWOT

Once research is complete, produce the SWOT analysis:

```
# Marketing SWOT — [Brand] — [Date]

## Strengths (internal — what we have)
| Strength | Evidence | Marketing implication |
|---|---|---|
| [Strength] | [Proof from brand.md or campaigns] | [How to amplify] |

## Weaknesses (internal — what we lack)
| Weakness | Evidence | Priority to fix |
|---|---|---|
| [Weakness] | [What's missing or underperforming] | High / Medium / Low |

## Opportunities (external — what's available)
| Opportunity | Source | How to capture |
|---|---|---|
| [Opportunity] | [Market trend / competitive gap / channel] | [Specific action] |

## Threats (external — what could hurt us)
| Threat | Likelihood | How to defend |
|---|---|---|
| [Threat] | High / Medium / Low | [Specific defense] |
```

---

## Step 4 — So what: the strategic read

After the table, add a 3-part strategic synthesis:

```
## The strategic read

### What this SWOT says to do
[1-2 sentences: the most important action implied by the quadrant intersections]

### The SO play (Strengths + Opportunities)
[How to use our biggest strength to capture the best opportunity — one sentence]

### The WT defense (Weaknesses + Threats)
[The risk we must not ignore — one sentence, and what to do about it]

### Recommended focus for next 90 days
1. [Priority 1 — specific initiative]
2. [Priority 2 — specific initiative]
3. [Priority 3 — specific initiative]
```

---

## Step 5 — Offer routing

```
SWOT complete. Want to act on any of this?

- "Build a campaign around [SO play]" → runs /blair:campaign
- "Fix the [weakness]" → routes to the right specialist
- "Go deeper on [competitor]" → runs /blair:competitor [name]
- "Give me a 90-day plan" → routes to blair-strategist
```

---

## Standards

- Strengths and Weaknesses must come from evidence — brand.md data, campaign history, known metrics. No invented flattery.
- Threats are external, not internal. "Our copy isn't good enough" is a Weakness, not a Threat.
- The strategic read is mandatory — a SWOT without "so what" is just a list.
- If this is a competitive SWOT (vs. a specific competitor), the Opportunities and Threats sections focus on the competitive dynamic, not the broad market.
