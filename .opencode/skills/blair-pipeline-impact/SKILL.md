---
name: blair:pipeline-impact
description: Review the revenue impact of your marketing — leads generated, pipeline created, deals closed, and which campaigns drove results. Connects marketing outputs to business outcomes. Reads real CRM exports when available.
---

# /blair:pipeline-impact

Triggered when the user runs `/blair:pipeline-impact`.

This command answers one question: **Is our marketing creating revenue?**

Not impressions. Not engagement. Revenue.

---

## Honest limits (read first)

- **CSV import, not live sync:** Blair reads a CRM export you drop at `.claude/cmo/data/pipeline-export.csv`. It does not auto-sync Salesforce, HubSpot, or other APIs. Export takes 2 minutes. See [docs/crm-export-guide.md](../../docs/crm-export-guide.md) for step-by-step instructions for every major CRM.
- **Attribution is narrative, not accounting:** Multi-touch attribution, channel mix, and CAC are only as good as the inputs. Label guesses as hypotheses.
- **Rough numbers are OK:** Manual estimates are valid if the user labels uncertainty.
- **Output is a decision brief** for the founder or marketer, not a financial statement.

---

## Execution

**Step 1: Read all context files**

Read in order:
1. `.claude/cmo/brand.md` — current goal and stage
2. `.claude/cmo/campaigns.md` — what campaigns have run
3. `.claude/cmo/pipeline.md` — prior pipeline snapshots
4. `.claude/cmo/insights.md` — prior performance reviews

**Step 2: Check for CSV export**

Check whether `.claude/cmo/data/pipeline-export.csv` exists.

**If the file exists** → go to Step 3 (CSV path).
**If the file does not exist** → go to Step 4 (manual intake path).

---

### Step 3: CSV path (preferred)

Invoke `blair-data-import` with:

```
## Blair Handoff — Pipeline Data Import

### Brand Profile
[full contents of .claude/cmo/brand.md]

### Task
Read .claude/cmo/data/pipeline-export.csv. Map columns, aggregate by source, and return the structured Pipeline Import block.
```

When `blair-data-import` returns:
- If it returns `NO_CSV_FOUND` → fall through to Step 4.
- If it returns the structured import block → proceed to Step 5 with that data as the pipeline input.

---

### Step 4: Manual intake (fallback when no CSV)

Tell the user:

> "No pipeline export found at `.claude/cmo/data/pipeline-export.csv`. I'll take numbers directly instead — or you can export from your CRM and drop the file there for a richer analysis. See [docs/crm-export-guide.md](docs/crm-export-guide.md) for step-by-step export instructions."

Then ask these questions one at a time:

1. "How many leads did marketing generate this month/quarter?"
2. "How many of those became sales opportunities?"
3. "How many closed? What was the average deal size?"
4. "Which campaign, channel, or sequence drove the most leads?"
5. "What's your current CAC — cost to acquire a customer — if you know it?"

---

**Step 5: Spawn blair-analytics with pipeline focus**

Invoke `blair-analytics` with this handoff:

```
## Blair Handoff — Pipeline Impact Review

### Brand Profile
[full contents of .claude/cmo/brand.md]

### Focus
Pipeline impact review. Prioritize revenue attribution, lead-to-close conversion, and CAC analysis over traffic or engagement metrics.

### Campaign History
[contents of .claude/cmo/campaigns.md]

### Outbound Sequences
[contents of .claude/cmo/pipeline.md]

### Prior Insights
[contents of .claude/cmo/insights.md]

### Pipeline Data
[structured import block from blair-data-import, OR manual intake answers from Step 4]

### Data source
[CSV import (HubSpot/Salesforce/etc) | Manual input | Mixed]
```

**Step 6: After delivery**

Append a snapshot to `.claude/cmo/pipeline.md`:

```markdown
## Pipeline Snapshot — [date]
- **Period:** [time range]
- **Data source:** [CSV export from [CRM] | Manual input]
- **Leads generated:** [N]
- **Lead → opportunity rate:** [%]
- **Opportunity → close rate:** [%]
- **Revenue attributed:** $[N]
- **Top channel:** [channel]
- **CAC:** $[N or unknown]
- **Export file:** [filename if CSV, or "manual" if not]
```

Then offer: "Drop an updated export next month and run `/blair:pipeline-impact` again. Blair will compare against this snapshot and show you the delta."
