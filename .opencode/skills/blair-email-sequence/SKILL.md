---
name: blair:email-sequence
description: Full email sequence for any trigger — welcome, post-demo, re-engagement, or custom flow.
---

# /blair:email-sequence

Triggered when the user runs `/blair:email-sequence` — optionally with a sequence type or trigger.

Examples:
- `/blair:email-sequence`
- `/blair:email-sequence welcome`
- `/blair:email-sequence post-demo`
- `/blair:email-sequence re-engagement`
- `/blair:email-sequence new trial signup`

---

## Step 1 — Orient

Read `.claude/cmo/brand.md`. If it's missing or has `[NEEDS BRIEF]` in critical fields: spawn `blair-brief` first.

---

## Step 2 — Identify sequence type

If the user specified the sequence type, use it. If not, ask:

> "What triggers this sequence — a new subscriber, a free trial signup, a completed demo, a stalled deal, or inactive subscribers?"

One question. Wait for the answer.

**Sequence types Blair handles:**
- `welcome` — new subscriber or lead magnet download
- `trial` or `onboarding` — free trial or product signup
- `post-demo` — after a sales demo
- `nurture` — warm leads not yet ready to buy
- `re-engagement` — subscribers who've gone cold
- `post-purchase` — new customers (onboarding + expansion)
- `winback` — churned customers

---

## Step 3 — Gather missing context (if needed)

Before writing, check brand.md for:
- ICP (who receives this sequence)
- Goal (what conversion looks like)
- Voice (tone to write in)
- Proof points (customer results to reference)

If proof points are missing, note it — and flag where in the sequence they'd have the most impact.

---

## Step 4 — Spawn blair-email

Pass this handoff context:

```
HANDOFF CONTEXT — /blair:email-sequence
Brand profile: [paste full brand.md]
Sequence type: [type]
Trigger: [what starts this sequence]
Goal: [what success looks like — trial conversion, demo booked, purchase, re-activation]
Task: Write the complete [type] email sequence. 
- Full subject lines (3 options each)
- Preview text
- Complete email body
- CTA with destination
- Send timing
Follow blair-email sequence structures exactly. Flag where proof points are missing.
```

---

## Step 5 — Deliver with send schedule

After the sequence is written, add a send schedule table:

```
## Send schedule

| Email | Trigger | Subject (recommended) | Goal |
|---|---|---|---|
| 1 | [trigger] | [subject] | [micro-goal] |
| 2 | Day [N] | [subject] | [micro-goal] |
...

## Before you send
- [ ] Personalization fields tested (`{{first_name}}` etc.)
- [ ] Plain text version exists
- [ ] Unsubscribe link present in every email
- [ ] SPF/DKIM configured on sending domain
- [ ] Send a test to yourself before activating
```

---

## Graceful degradation (Gmail / automation)

If the user has **no** Gmail draft integration or MCP mail tool:

1. Deliver the **full sequence in chat** with clear labels: **Subject:**, **Body:**, **CTA link:** for each email.
2. Say explicitly: *"Copy into your ESP or Gmail. Blair did not send mail."*
3. Do not imply drafts were created in Google unless a tool confirmed success.

See `docs/setup-gmail-calendar.md` in the Blair repo for optional Google setup.

---

## Standards

- One idea per email. One CTA per email. No stacking.
- Never write "I hope this email finds you well" or any variation.
- If the brand has hard bans in voice profile, check every email before delivering.
- If sequence exceeds 7 emails, flag it and justify — attention is finite.
- Sequences for B2B sales cycles can be longer; B2C/PLG sequences should be tighter.
