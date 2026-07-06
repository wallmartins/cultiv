---
name: blair:escalation
description: Scores every active campaign for risk and surfaces what needs attention before it becomes a crisis.
---

# /blair:escalation

Triggered when the user runs /blair:escalation.
Reads every active campaign and surfaces what is at risk before the user has to ask.

This is Blair being a partner, not a tool.
An EA catches problems before they land on the CMO desk as a crisis.
This skill does the same thing.

---

## Step 1 -- Read everything

Read:
- .claude/cmo/campaigns.md -- all active campaigns
- .claude/cmo/marquee.md -- if it exists, the locked messaging
- .claude/cmo/insights.md -- past performance data and issues
- .claude/cmo/learnings.md -- user preferences and corrections
- .claude/cmo/brand.md -- goals, stage, constraints

---

## Step 2 -- Run live checks

Use WebSearch to check:
- Any competitor launched something in the last 14 days that affects active campaigns?
- Any news in the category that changes the relevance of current messaging?
- Any public feedback (Reddit, reviews, social) on the brand or active campaigns?

---

## Step 3 -- Score each campaign for risk

For each active campaign, assess:

| Risk factor | Signal |
|---|---|
| Timeline | Is the launch date close with assets still missing? |
| Baseline coverage | Are existing products supported during the launch period? |
| Messaging drift | Does the campaign messaging match marquee.md? |
| Competitive threat | Did a competitor just move on this positioning? |
| Channel gap | Is a planned channel missing from the asset list? |

Score each: GREEN (on track), YELLOW (watch), RED (needs action today).

---

## Step 4 -- Output the escalation report

```
# Blair Escalation Check -- [date]

## Summary
[One sentence: overall risk posture across active campaigns]

## Campaign Risk Scores

### [Campaign Name] -- [GREEN / YELLOW / RED]
**Risk:** [What specifically is at risk]
**Signal:** [What surfaced it -- timeline gap, competitor move, messaging drift, etc.]
**Action:** [Specific action to take -- which Blair specialist to spawn, what decision to make]

### [Campaign Name] -- [...]

## Proactive flags
[Things that are not yet a problem but will become one -- surface them now]

## No action needed
[Campaigns that are on track -- list them so the CMO knows Blair checked]
```

---

## Standards

- Every RED flag must include a specific action with a named specialist.
- Do not flag YELLOW unless there is a specific reason. Vague concern is noise.
- If all campaigns are GREEN, say so. Do not manufacture risk.
- The escalation check is not a status report -- it is a prioritization tool. The CMO should be able to read it and immediately know what to do.
