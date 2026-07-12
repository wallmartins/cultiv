---
name: blair:brands
description: Lists all brand profiles and the currently active one. Manages multi-brand setup in Blair.
---

# /blair:brands

Triggered when the user runs `/blair:brands` — lists all brand profiles and the currently active one.

---

## Step 1 — Check for multi-brand setup

Look for brand profiles in these locations (in order):

1. `.claude/cmo/brands/` — multi-brand directory (one subdirectory per brand)
2. `.claude/cmo/brand.md` — single-brand setup (legacy / solo use)

---

## Step 2 — Read the active brand

Check `.claude/cmo/active-brand` — if it exists, read the file. It contains the slug of the currently active brand (e.g., `acme-corp`).

If the file doesn't exist, the active brand is the single `.claude/cmo/brand.md` (or none, if it doesn't exist yet).

---

## Step 3 — List all brands

For each brand found in `.claude/cmo/brands/[slug]/brand.md`, extract:
- The brand name (from the `## Product` section of brand.md)
- Whether it's the active brand

Output format:

```
## Blair Brand Profiles

| Brand | Slug | Status |
|---|---|---|
| [Brand name from brand.md] | [slug/directory name] | ✅ Active / — |
| [Brand name] | [slug] | — |
...

**Active brand:** [slug] (or "none — run /blair:start to create one")

---
Switch brands with: `/blair:switch [slug]`
Add a new brand with: `/blair:start [brand-name]`
```

---

## Step 4 — If no brands exist

```
No brand profiles found.

Run `/blair:start` to set up your first brand, or `/blair:start [brand-name]` to create a named profile for multi-brand use.
```

---

## Standards

- Read-only operation — never modify any brand profile or active-brand file.
- If brand.md exists but no brands/ directory, show the single profile and suggest the multi-brand structure if it seems like an agency setup.
