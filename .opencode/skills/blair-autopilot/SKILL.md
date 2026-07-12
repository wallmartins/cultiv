---
name: blair:autopilot
description: Turn Blair from reactive to proactive — schedule automatic weekly briefs, pipeline checks, and escalation alerts using Claude Code's built-in cron scheduler.
---

# /blair:autopilot

Triggered when the user runs `/blair:autopilot`.

By default Blair only runs when you ask it to. Autopilot changes that. It schedules recurring tasks that run on a timer — no commands needed, no remembering to check in. Blair surfaces what matters before you have to ask.

---

## Execution

**Step 1: Show what autopilot can schedule**

Present the available automations:

```
Blair Autopilot — available schedules:

[1] Weekly brief       Every Monday at 9am — what shipped, what's performing, what to do this week
[2] Pipeline check     Every Friday at 4pm — are active sequences getting replies? Is pipeline moving?
[3] Escalation check   Every Wednesday at 9am — any campaign underperforming? Any sequence stalled?
[4] All three          Full autopilot mode

Which would you like to enable? (1, 2, 3, or 4)
```

Wait for the answer.

---

**Step 2: Confirm timezone**

> "What timezone should these run in?"

---

**Step 3: Create the scheduled tasks**

Use the `CronCreate` tool to register each selected automation.

**Weekly brief (option 1):**
```
schedule: 0 9 * * 1  (every Monday at 9am)
prompt: /blair:weekly-brief
description: Blair weekly CMO standup
```

**Pipeline check (option 2):**
```
schedule: 0 16 * * 5  (every Friday at 4pm)
prompt: Run a quick pipeline health check. Read .claude/cmo/pipeline.md. Flag any outbound sequences with no replies after 7+ days. Flag any sequences that were launched but never updated with reply data. Give me a 3-bullet status update and tell me if anything needs attention this weekend.
description: Blair weekly pipeline health check
```

**Escalation check (option 3):**
```
schedule: 0 9 * * 3  (every Wednesday at 9am)
prompt: /blair:escalation
description: Blair mid-week escalation check
```

After creating, confirm:
> "[N] autopilot tasks scheduled. Blair will surface these automatically — no commands needed.
>
> To pause or cancel: run `/blair:autopilot off`
> To see what's scheduled: run `/blair:autopilot status`"

---

**Step 4: Log to brand.md**

Append to `.claude/cmo/brand.md` under a new `## Autopilot` section:

```markdown
## Autopilot
- Weekly brief: Mondays 9am [timezone]
- Pipeline check: Fridays 4pm [timezone]
- Escalation check: Wednesdays 9am [timezone]
- Enabled: [date]
```

---

## Sub-commands

### `/blair:autopilot status`
List all active scheduled tasks. Use `CronList` to retrieve current schedules and display them in a readable format.

### `/blair:autopilot off`
Cancel all Blair autopilot schedules. Use `CronList` to find Blair-created tasks, then `CronDelete` to remove them. Confirm:
> "Autopilot off. Blair will no longer run on a schedule. Run `/blair:autopilot` to re-enable."

### `/blair:autopilot off weekly-brief` (or other specific task)
Cancel a single schedule. Use `CronList` to find the matching task by description, then `CronDelete` to remove only that one.

---

## What Autopilot Is Not

Autopilot schedules commands to run — it does not monitor your accounts in real time. It is not a live alert system. Think of it as a recurring calendar reminder that executes the Blair command automatically instead of just pinging you.

Real-time signal monitoring (competitor mentions, review spikes, news triggers) is not yet available.
