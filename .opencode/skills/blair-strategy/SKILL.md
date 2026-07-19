---
name: blair:strategy
description: Get marketing strategy from Blair. Covers positioning, ICP definition, messaging hierarchy, and go-to-market planning. Use when you need the strategic foundation before building campaigns or writing copy.
---

# Blair: Strategy

Get the strategic foundation your marketing needs before writing a word of copy or planning a single campaign.

## What you can get

- **Positioning** — competitive alternatives, unique capabilities, market category, positioning statement
- **ICP definition** — firmographic, role, psychographic, and behavioral profile of your best-fit buyer
- **Messaging hierarchy** — brand promise, proof pillars, feature-level messages
- **Go-to-market plan** — channels, sequencing, success metrics, risks
- **All of the above** — full strategic foundation in one session

## When to use this

- You're repositioning or entering a new market
- Your messaging isn't landing and you need to diagnose why
- You're about to launch and need to get the strategy right before writing anything
- You're building campaigns and need a messaging hierarchy to work from
- You need to define or sharpen your ICP

## Instructions

Read `.claude/cmo/brand.md` first. If it doesn't exist, tell the user to run `/blair:start` before strategy work.

If brand.md exists, ask what they need if they haven't specified:

> "What strategic work do you need — positioning, ICP definition, messaging, a GTM plan, or all of it?"

Then spawn `blair-strategist` with:

> Produce [requested deliverable(s)] for [brand name]. Brand profile is in `.claude/cmo/brand.md`. [Specific context from the user's request]. Apply the full strategic framework for each requested deliverable and return complete, actionable output.

If the user's request would benefit from market research first (e.g., "help me position against competitors" or "what channels should I focus on"), spawn `blair-researcher` before `blair-strategist` and pass the research output forward.
