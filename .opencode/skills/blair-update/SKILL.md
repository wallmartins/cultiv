---
name: blair:update
description: Update specific fields in your brand profile without re-running the full onboarding interview. Use when your ICP shifts, you have new competitors, your goals change, or any part of brand.md needs refreshing.
---

# Blair: Update

Refresh specific parts of your brand profile without starting over.

## Usage

```
/blair:update              → Blair asks what you want to update
/blair:update icp          → Update your ICP definition
/blair:update competitors  → Update competitor list and positioning
/blair:update goals        → Update current priority, channels, or constraints
/blair:update voice        → Update brand voice, personality, or hard bans
/blair:update positioning  → Update differentiator and proof points
/blair:update sources      → Update Research sources (URLs, files researchers should trust)
```

## Instructions

Read `.claude/cmo/brand.md` first. If it doesn't exist, tell the user to run `/blair:start` instead.

### Determine what to update

If the user specified a field (icp, competitors, goals, voice, positioning), go directly to that field.

If no field was specified, ask: "What's changed? Tell me what you want to update — ICP, competitors, goals, voice, positioning, research sources, or something else."

### Update protocol

For the target field(s), ask focused questions — one at a time:

**ICP update:**
> "How has your ideal customer changed? Walk me through who you're targeting now — role, company size, and their main pain."

**Competitors update:**
> "Who are you competing against now? Name them and tell me the one thing that differentiates you from each."

**Goals update:**
> "What's your #1 marketing priority right now — awareness, acquisition, retention, or revenue? And which channels are you focused on?"

**Voice update:**
> "How would you describe your brand voice now — what's changed, or what do you want it to be? Any words or tones to add to the hard ban list?"

**Positioning update:**
> "What's the one thing you lead with now? And what's the strongest proof point you have today?"

**Research sources update:**
> "Which URLs or internal files should Blair treat as authoritative before guessing from the open web? (e.g. G2 link, pricing page, Notion doc path.)"

### Write the update

After collecting the new information, open `.claude/cmo/brand.md` and update only the relevant section(s). Do not touch fields that weren't part of this update.

Confirm:
> "Updated. [Field] in your brand profile now reflects [brief summary of what changed]. Blair will use the new version going forward."

Never rewrite the entire brand.md for a partial update. Surgical edits only.
