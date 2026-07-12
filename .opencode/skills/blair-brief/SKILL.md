# /blair:brief

Triggered when the user runs /blair:brief. No arguments needed.
Produces a morning brief: what is live, what is due, what is drifting, what competitors did this week.

This is the one skill that runs without being asked.
The CMO opens it at the start of the day. It tells them what to pay attention to.

---

## Step 1 -- Orient silently

Read all of the following if they exist:
- .claude/cmo/brand.md (or active brand profile)
- .claude/cmo/campaigns.md
- .claude/cmo/insights.md
- .claude/cmo/learnings.md
- .claude/cmo/marquee.md
- .claude/cmo/stakeholders.md

Identify:
- What campaigns are currently active (Status: Designed or In Progress)
- What the brand last worked on in Blair
- Any learnings that have been logged
- Any stakeholder touchpoints coming up

---

## Step 2 -- Run live competitive check

Use WebSearch to run these searches (adapt for the brand category):
- "[Brand name] news" -- last 7 days
- "[Category] news" -- last 7 days
- "[Top competitor name] news" -- last 7 days

Look for: product launches, pricing changes, funding announcements, PR coverage, messaging shifts.
Report only what is new and relevant. Skip noise.

---

## Step 3 -- Assemble the brief

Return this structure. Keep each section tight -- this is a brief, not a report.

```
# Blair Morning Brief -- [today date]
Working in [Brand Name] context.

---

## What needs attention today
[1-3 bullets max. The most urgent things -- deadlines, decisions, at-risk items.
If nothing urgent, say: Nothing critical. Use this time to advance [active campaign].]

## Active campaigns
[For each active campaign: name, status, next milestone, any risk signal]
[If no campaigns: No active campaigns logged. Run /blair:campaign to start one.]

## Competitor activity (last 7 days)
[What competitors did -- with source. If nothing notable, say: No significant moves detected.]

## Market / category signals
[Any relevant news in the category that affects positioning or messaging]

## Stakeholder touchpoints
[From stakeholders.md -- who has a touchpoint coming up, any sensitivities to note]
[If no stakeholders file: No stakeholder context loaded. Copy stakeholders.md.example to create one.]

## What Blair recommends today
[One specific suggestion -- the single highest-value action to take based on everything above]
```

---

## Standards

- The brief must be readable in under 2 minutes. If it takes longer, it is too long.
- Do not invent urgency. If there is nothing critical, say so.
- The competitor section must come from live WebSearch -- never from memory.
- One recommendation. Not a list of options. The CMO is deciding, not exploring.
- If the brand profile is missing or incomplete, open with that as the top priority: Brand profile is incomplete. Run /blair:start before the brief can be useful.
