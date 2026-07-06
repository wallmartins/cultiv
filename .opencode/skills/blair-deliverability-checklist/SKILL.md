---
name: blair:deliverability-checklist
description: Pre-send deliverability check — 6 questions, scored pass/fix output. Runs standalone or auto-called after sequence commands. No brand profile required.
---

# /blair:deliverability-checklist

Triggered when the user runs `/blair:deliverability-checklist`, or called automatically at the end of `/blair:cold-outbound` and `/blair:sequence-from-list`.

When auto-called, open with:
> "Before you send — quick deliverability check. Takes 2 minutes and can save your domain reputation."

When standalone, open with:
> "Let's check your sending setup before you launch. Six questions."

---

## No brand profile required

This skill runs without `.claude/cmo/brand.md`. It is a setup-validation tool, not a brand-aware tool.

---

## Execution

Ask these 6 questions one at a time. Wait for each answer before asking the next.

**Question 1:**
> "How old is the domain or subdomain you're sending from? (e.g., '6 months', 'just registered last week', 'not sure')"

**Question 2:**
> "Are SPF, DKIM, and DMARC configured on your sending domain? (You can check at mxtoolbox.com — or say 'not sure')"

**Question 3:**
> "Are you sending cold outreach from a subdomain separate from your main domain? For example, sending from mail.yourcompany.com instead of yourcompany.com?"

**Question 4:**
> "Have you warmed this inbox before sending cold outreach? (Using a tool like Warmbox, Mailwarm, or manual warm-up for 2+ weeks?)"

**Question 5:**
> "What daily sending volume are you planning when you first launch this sequence?"

**Question 6:**
> "Do you have a reply rate benchmark from prior campaigns, or a target you're aiming for?"

---

## Scoring

After all 6 answers, produce a scored pass/fix table. Use three severity levels:

- **BLOCK** — stop, fix this before sending or you risk domain blacklisting
- **WARN** — high risk, fix soon; sending will work but outcomes will suffer
- **NOTE** — best practice, optional but recommended

Score each answer against these conditions:

| Check | Pass condition | Severity if fail |
|-------|---------------|-----------------|
| Domain age | 30+ days old | BLOCK if under 14 days; WARN if 14–29 days |
| SPF configured | Yes | WARN |
| DKIM configured | Yes | WARN |
| DMARC configured | Yes | NOTE |
| Subdomain used | Yes — cold from subdomain, not root domain | WARN |
| Inbox warmed | Yes, at least 2 weeks | BLOCK if no warmup at all; WARN if under 2 weeks |
| Daily volume at launch | 50 or fewer per day | WARN if 51–100; BLOCK if over 100 on an unwarmed or new domain |
| Has reply rate benchmark | Any number given | NOTE if none |

---

## Output format

Present results as a table, then a one-line summary.

Example output:

```
## Deliverability Check

| Check | Status | Action |
|-------|--------|--------|
| Domain age (8 days) | BLOCK | Wait until day 30 before sending cold outreach. |
| SPF | PASS | — |
| DKIM | PASS | — |
| DMARC | NOTE | Add a DMARC record for full protection. |
| Subdomain used | WARN | Send from mail.yourdomain.com — not yourdomain.com. |
| Inbox warmed | BLOCK | Run warmup for 2 weeks minimum before cold sends. |
| Daily volume (200/day) | BLOCK | Start at 20–30/day on a new domain. Ramp over 4 weeks. |
| Reply rate benchmark | NOTE | Set a target now — industry average for cold email is 3–8%. |

3 BLOCKs, 1 WARN, 2 NOTEs — fix the blocking items before you send.
```

If all checks pass:
```
All checks PASS. No blocking issues — ready to send.
```

---

## Close

End with one practical next step relevant to the highest-severity issue found.

- If any BLOCK: "Fix the blocking items above before sending. Sending on a cold, unwarmed, young domain will land in spam and can permanently damage your domain reputation."
- If only WARNs: "No blockers, but the warnings above will hurt reply rates. Address them before scaling volume."
- If all PASS: "You're set up well. Monitor reply rates — if you drop below 2%, pause and check spam placement."
