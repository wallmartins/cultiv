---
name: blair:campaign
description: Build a complete marketing campaign. Blair designs the strategy, channel mix, messaging map, asset list, and timeline — then produces all the copy and content. Works for launches, growth campaigns, nurture sequences, and brand awareness.
---

# Blair: Campaign

Build a complete campaign from brief to ready-to-publish assets.

## What you get

A full campaign package:
- **Campaign brief** — objective, ICP, core message, proof point
- **Channel plan** — which channels, what format, what frequency, what CTA
- **Messaging map** — how the message adapts by channel and buyer stage
- **Asset list** — every piece of copy and content needed, labeled by type
- **Timeline** — week-by-week execution plan
- **Success metrics** — north star, leading indicators, failure signals
- **All assets written** — copy and content produced and ready to use

## Campaign types

- **Launch** — new product, feature, or market entry
- **Growth** — acquisition campaign for an active product
- **Nurture** — onboarding, retention, or re-engagement sequences
- **Awareness** — build category presence and owned audience

## Instructions

Read `.claude/cmo/brand.md` first. If it doesn't exist, tell the user to run `/blair:start` before building a campaign.

If brand.md exists, ask the user one question if they haven't specified:

> "What kind of campaign are you building — a launch, a growth push, a nurture sequence, or brand awareness? And what's the main goal?"

Then run the full campaign pipeline in sequence:

1. Spawn `blair-researcher` — research competitors and channels relevant to this campaign type
2. Spawn `blair-strategist` — define campaign positioning and messaging hierarchy
3. Spawn `blair-campaigns` — design the campaign architecture and produce the asset list
4. Spawn `blair-copy` — write all conversion copy assets from the list
5. Spawn `blair-content` — write all content assets from the list
6. Synthesize and present the complete campaign package

Pass the brand profile and each specialist's output forward in the handoff context at each step.
