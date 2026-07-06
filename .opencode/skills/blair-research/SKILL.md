---
name: blair:research
description: Get market and competitive intelligence from Blair. Researches competitors, market size, audience behavior, channel analysis, and industry trends. Returns a structured brief ready to feed into strategy or campaign work.
---

# Blair: Research

Get structured market and competitive intelligence before you build strategy or campaigns.

## What you can get

- **Competitive intelligence** — competitor positioning, pricing, messaging, weaknesses, and differentiation opportunities
- **Market research** — market size, growth signals, buying triggers, seasonal patterns
- **Audience intelligence** — where your ICP lives online, how they describe their problem, what content earns their attention
- **Channel analysis** — which channels competitors use, organic search volume, communities worth engaging
- **Trend research** — what's changing in your market and what it means for your marketing

## When to use this

- Before building a campaign — understand the landscape first
- Before repositioning — know what's already claimed
- Before entering a new channel — understand if your ICP is there
- Before a product launch — competitive and audience intel in one brief
- Anytime you need to know what you're up against

## Instructions

Read `.claude/cmo/brand.md` first. If it doesn't exist, tell the user to run `/blair:start` before research work.

If brand.md exists, ask what they need if they haven't specified:

> "What do you need researched — competitors, market size, your audience, specific channels, or industry trends?"

Then spawn `blair-researcher` with:

> Research [specified topic] for [brand name]. Brand profile is in `.claude/cmo/brand.md`. [User's specific request and any constraints]. Return a structured research brief with sources, key findings, opportunity gaps, and a recommended next step.

If the user names **real competitors** and needs battle-card-grade trust, suggest **`/blair:research-integrity`** instead — mandatory Competitor Fact Table per `docs/research-integrity.md`.

After the research brief is returned, offer the logical next step:
- "Want me to feed this into a positioning strategy?"
- "Should I use this to design a campaign?"
- "Ready to write copy based on these findings?"
