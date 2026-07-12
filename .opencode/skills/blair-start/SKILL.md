---
name: blair:start
description: Run Blair's onboarding interview to create a persistent brand profile. Supports an optional brand name for multi-brand (agency) setups. Run once per brand — Blair uses the profile automatically for every future task.
---

# Blair: Start

Set up Blair for your brand. Runs a one-time intake interview and writes a persistent brand profile.

Supports two modes:
- `/blair:start` — single brand setup (default)
- `/blair:start [brand-name]` — named brand for multi-brand / agency use (e.g., `/blair:start acme-corp`)

---

## Single-Brand Setup (`/blair:start`)

**Mode selection:**

Check if the user added a mode flag to the command:
- `/blair:start --fast` → pass `MODE: fast` to blair-onboarding (2-question fast lane)
- `/blair:start --deep` → pass `MODE: deep` to blair-onboarding (20-question deep dive)
- `/blair:start` (no flag) → standard 6-question mode (default)

If no flag and brand.md doesn't exist, offer the choice before running:
> "Quick question before we start: do you want the **fast setup** (2 questions, done in 2 minutes) or the **full deep dive** (20 questions, complete brand picture)?
> - `/blair:start --fast` for fast
> - `/blair:start --deep` for deep
> - Or just press enter for the standard 6-question setup."

Wait for their response, then invoke blair-onboarding with the appropriate MODE.

Check `.claude/cmo/brand.md` before doing anything:

**If `brand.md` does not exist:**
Invoke `blair-onboarding` with: "Run the full brand onboarding interview. No brand.md exists yet. Ask the 6 critical questions one at a time, write the completed profile to `.claude/cmo/brand.md`, and confirm."

**If `brand.md` exists and has no `[NEEDS BRIEF]` fields:**
Tell the user: "Your brand profile is already set up. Blair is ready — what do you want to work on?" Do not re-run onboarding.

**If `brand.md` exists but has `[NEEDS BRIEF]` fields:**
Tell the user which fields are missing, then invoke `blair-onboarding` with: "brand.md exists but has [NEEDS BRIEF] in these fields: [list them]. Ask only about those fields. Skip everything else. Update brand.md when done."

---

## Multi-Brand Setup (`/blair:start [brand-name]`)

When the user provides a brand name (e.g., `/blair:start acme-corp`):

1. Convert the name to a slug (lowercase, hyphens for spaces): `acme-corp`
2. Check `.claude/cmo/brands/[slug]/brand.md`:

**If the profile doesn't exist:**
Invoke `blair-onboarding` with: "Run the full brand onboarding interview for a new brand called '[brand-name]'. Ask the 6 critical questions one at a time, write the completed profile to `.claude/cmo/brands/[slug]/brand.md` (create the directory if needed), and confirm when done."

After `blair-onboarding` completes, write the slug to `.claude/cmo/active-brand` to make this brand active.

Confirm: "Brand profile for **[brand-name]** is ready. Blair is now working in [brand-name] context. Use `/blair:switch [slug]` to change brands, or `/blair:brands` to see all profiles."

**If the profile exists and is complete:**
Tell the user: "Brand profile for **[brand-name]** already exists. Switching to it now." Then write the slug to `.claude/cmo/active-brand`.

**If the profile exists but has `[NEEDS BRIEF]` fields:**
Tell the user which fields are missing, run targeted gap-fill via `blair-onboarding`, then switch to that brand.

---

## When to re-run

- You've pivoted the product or positioning
- Your ICP has changed
- You're entering a new market
- You want to update voice or goals
- More than 3 months have passed and the profile feels stale

For targeted updates without re-running the full interview: use `/blair:update [field]`.
