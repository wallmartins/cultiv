---
name: blair:brief-agency
description: Produce a complete creative brief to hand to a design agency, freelancer, or internal creative team. Structured, specific, and ready to send.
---

# /blair:brief-agency

Triggered when the user runs `/blair:brief-agency` with an optional project description.

Examples:
- `/blair:brief-agency`
- `/blair:brief-agency homepage redesign`
- `/blair:brief-agency Q3 email campaign`

---

## Execution

**Step 1: Read brand profile**

Check `.claude/cmo/brand.md`. If missing:
> "Run `/blair:start` first — the agency brief needs your brand profile to be useful."
Stop.

**Step 2: Gather project context**

If project was named in the command, use it.

If not, ask:
> "What's the project? Give me a one-line description — e.g., 'homepage redesign', 'product launch email campaign', 'paid ad creative for LinkedIn.'"

Then ask:
> "Who is receiving this brief — an external agency, a freelance designer, or your internal team?"

Then ask:
> "What's the deadline and approximate budget (or just say 'no budget set')?"

**Step 3: Check campaign logs**

If `.claude/cmo/campaigns.md` exists, check if there's a relevant campaign already designed. If so, pull the messaging map and asset list from it to anchor the brief.

**Step 4: Produce the brief**

Write the creative brief directly:

```
# Creative Brief: [Project Name]
**Prepared by:** Blair (AI CMO)
**Brand:** [Brand name from brand.md]
**Date:** [today]
**Deadline:** [from user]
**Budget:** [from user]
**Recipient:** [agency/freelancer/internal]

---

## The assignment
[1-2 sentences: what we need built and why it matters right now]

## The goal
**Primary objective:** [one measurable outcome — e.g., "Increase homepage trial signups by 20%"]
**Secondary objective:** [optional]
**How we'll measure success:** [specific metric and timeframe]

## The audience
**Primary:** [ICP from brand.md — role, company size, pain point]
**What they currently believe:** [their current mindset before seeing this creative]
**What we want them to believe after:** [the shift we're creating]

## The message
**Headline direction:** [the core idea — not the actual headline, but the angle]
**Key message:** [the one thing this creative must communicate]
**Supporting points (in priority order):**
1. [proof point or benefit]
2. [proof point or benefit]
3. [proof point or benefit]

**What to say:** [phrases, claims, and language from brand.md that must appear]
**What never to say:** [hard bans from brand.md]

## The deliverables
| Asset | Format | Dimensions / Specs | Quantity |
|---|---|---|---|
| [asset] | [format] | [specs] | [N] |

## Brand reference
**Voice:** [from brand.md — 3 words]
**Reference brand:** [from brand.md]
**Colors:** [from brand.md]
**Fonts:** [from brand.md]
**Existing assets:** [link or path if known]

## Competitive context
**Top competitors:** [from brand.md]
**How we're different:** [key differentiator]
**What NOT to look like:** [competitor or style to avoid]

## Constraints
[Budget, legal review needs, platform restrictions, anything the creative team must know]

## Timeline
| Milestone | Date |
|---|---|
| Brief delivered | [today] |
| Concepts due | [date] |
| Revisions | [date] |
| Final delivery | [deadline] |

## Questions for the creative team
[2-3 open questions Blair has that the agency/freelancer should answer in their response]

---
*Built with Blair — [brand name] brand profile v[date of last brand.md update]*
```

**Step 5: After delivery**

Offer: "Want me to email this brief to the agency? Paste their address and I'll create a Gmail draft."

If yes, use the Gmail MCP tool (`create_draft`) to create a draft with the brief as the body.
