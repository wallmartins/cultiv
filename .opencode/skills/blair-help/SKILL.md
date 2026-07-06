---
name: blair:help
description: Help and documentation for all Blair commands, organized by topic or area of focus.
---

# /blair:help

Triggered when the user runs `/blair:help` — with an optional topic.

Examples:
- `/blair:help`
- `/blair:help campaigns`
- `/blair:help email`
- `/blair:help multi-brand`

Prints what Blair can do. Works without a brand profile — this is a discovery tool.

---

## Full help output (no topic specified)

```
# Blair — AI CMO Agent

Blair handles any marketing ask. Tell it what you need, or use a slash command.

---

## Setup

| Command | What it does |
|---|---|
| `/blair:start` | Set up your brand profile (run once — or once per brand) |
| `/blair:update` | Update specific brand profile fields (`icp`, `competitors`, `goals`, `voice`, `positioning`, `sources`, …) |
| `/blair:status` | See what Blair knows and what's been done |
| `/blair:brands` | List all brand profiles (agencies) |
| `/blair:switch` | Switch the active brand (agencies) |

---

## Strategy & Research

| Command | What it does |
|---|---|
| `/blair:strategy` | Positioning, ICP definition, messaging, GTM plan |
| `/blair:research` | Competitive and market intelligence |
| `/blair:research-integrity` | Research with mandatory Competitor Fact Table + gaps (named companies) |
| `/blair:swot` | Marketing SWOT with strategic synthesis and 90-day priorities |
| `/blair:competitor` | Deep competitor research + battle card |

---

## Daily Operations

| Command | What it does |
|---|---|
| `/blair:brief` | Morning brief -- live competitive check, what is active, what competitors did this week |
| `/blair:escalation` | Escalation check -- scores every active campaign for risk, surfaces what needs action today |

---

## Campaigns & Content

| Command | What it does |
|---|---|
| `/blair:campaign` | Build a complete campaign end-to-end |
| `/blair:launch` | Coordinated launch kit — strategy, campaign, copy, and PR |
| `/blair:calendar` | 30/60/90-day content calendar |
| `/blair:repurpose` | Repurpose one asset across all channels |
| `/blair:post` | Write a platform-native social post (LinkedIn, X, Instagram, etc.) |

---

## Copy & Assets

| Command | What it does |
|---|---|
| `/blair:headline` | 10 headline variations for any surface |
| `/blair:email-sequence` | Full email sequence for any trigger |
| `/blair:review` | Scored copy review with line-by-line diagnosis and rewrites |

---

## Audit & Analytics

| Command | What it does |
|---|---|
| `/blair:audit` | Scored audit of existing marketing assets |
| `/blair:swot` | Marketing SWOT — strengths, weaknesses, opportunities, threats |

---

## Revenue & Pipeline

| Command | What it does |
|---|---|
| `/blair:pipeline-impact` | Review marketing's revenue impact — leads, pipeline, deals closed, CAC |
| `/blair:weekly-brief` | Monday CMO standup — what shipped, what's performing, what to do this week |
| `/blair:crm-setup` | Connect HubSpot, Salesforce, or Pipedrive — pipeline pulls automatically after this |
| `/blair:autopilot` | Schedule automatic weekly briefs, pipeline checks, and escalation alerts |

---

## Outbound

| Command | What it does |
|---|---|
| `/blair:cold-outbound` | Build a cold outbound sequence — email, LinkedIn DMs, or phone scripts |
| `/blair:sequence-from-list` | Drop a CSV from Seamless, Apollo, or LinkedIn — get segmented sequences + import-ready CSV files |
| `/blair:deliverability-checklist` | Pre-send domain and setup check — 6 questions, scored BLOCK/WARN/NOTE output |
| `/blair:brief-agency` | Write a complete creative brief for an agency or freelance designer |

---

## Or just ask

You don't need a slash command for everything. Try:

> "Write me a welcome email sequence"
> "Who are my top 3 competitors and how do I beat them?"
> "Build a Q3 LinkedIn content plan"
> "Review this homepage copy: [paste it]"
> "What paid media strategy makes sense for our stage?"
> "Give me 10 headline options for our pricing page"
> "Build me a cold email sequence for VPs of Sales at Series B companies"
> "What's our pipeline impact from last quarter's campaign?"
> "Give me my weekly marketing brief"
> "Write a creative brief for our homepage redesign"

Blair reads your brand profile automatically and routes to the right specialist.

---

**Need to set up Blair first?** Run `/blair:start`
**Coming back after a break?** Run `/blair:status`
```

---

## Topic-specific help

If the user specifies a topic, filter to the relevant section and add 2-3 example natural language prompts for that area:

**campaigns / launch / content** → show the Campaigns & Content section + examples like "Build me a launch campaign for [feature]"

**email** → show the Copy & Assets section, mention `blair-email` specialist, give examples

**multi-brand / agency / brands** → show the Setup section, explain the brands/ directory structure and the `/blair:switch` workflow

**audit / analytics / performance** → show Audit & Analytics section + "what to paste or share with Blair"

---

## Standards

- Never requires a brand profile. This is a zero-state tool.
- Keep it scannable — tables over paragraphs.
- End every help response with a single prompt: the most likely next step for someone reading this.
