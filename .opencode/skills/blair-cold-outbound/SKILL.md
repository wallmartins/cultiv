---
name: blair:cold-outbound
description: Build a cold outbound sequence — cold email, LinkedIn DMs, or phone scripts — optimized for reply rate. Pass a target description or leave blank to be prompted.
---

# /blair:cold-outbound

Triggered when the user runs `/blair:cold-outbound` with an optional target description.

Examples:
- `/blair:cold-outbound`
- `/blair:cold-outbound VP of Sales at Series B SaaS companies`
- `/blair:cold-outbound SDRs at staffing agencies`

---

## Execution

**Step 1: Read brand profile**

Check `.claude/cmo/brand.md`. If it doesn't exist, tell the user:
> "Run `/blair:start` first so Blair knows your brand before building outbound sequences."
Stop here.

**Step 2: Check pipeline log**

If `.claude/cmo/pipeline.md` exists, read it. Note any active sequences to avoid duplicating.

**Step 3: Gather target context**

If the user provided a target in the command arguments, use it.

If not, ask one question:
> "Who are you reaching out to? Give me the role, company type, and ideally a trigger — e.g., 'VP of Sales at Series B SaaS companies who just posted a job for an SDR manager.'"

Wait for the answer.

**Step 3b: Research integrity (competitor facts)**

If the user asks for copy that **asserts specific facts** about a **named competitor** (vendor pricing, weaknesses, market position), run **`/blair:research-integrity`** (or spawn `blair-researcher` with the Fact Table requirement from `docs/research-integrity.md`) **before** `blair-outbound`. If the sequence only targets a role/ICP with no competitor claims, skip this.

**Step 4: Ask channel preference**

> "Which channel — cold email, LinkedIn DMs, phone scripts, or all three?"

Wait for the answer.

**Step 5: Spawn blair-outbound**

Invoke `blair-outbound` with this handoff:

```
## Blair Handoff — Cold Outbound

### Brand Profile
[full contents of .claude/cmo/brand.md]

### User Request
Build a cold outbound sequence.

### Target
[target description from user]

### Channel
[channel preference from user]

### Active Sequences (do not duplicate)
[contents of .claude/cmo/pipeline.md if exists, else "none"]
```

**Step 6: After delivery**

Confirm the sequence was logged to `.claude/cmo/pipeline.md`.

If **no** mail-sending or draft tool ran successfully, ensure the user still has **copy-paste-ready** full text for every email and LinkedIn message. Say: *"Paste into your sequencer or inbox. Blair did not send on your behalf."*

Offer:
> "Want me to also build a `/blair:pipeline-impact` baseline so you can track replies and revenue attributed to this sequence?"

See `docs/setup-gmail-calendar.md` in the Blair repo for optional Google setup.

**Step 7: Deliverability check**

Call `/blair:deliverability-checklist` immediately after sequence delivery with this preamble:
> "Before you send — quick deliverability check. Takes 2 minutes and can save your domain reputation."

Run the full 6-question flow. Do not skip this step.
