---
name: blair:switch
description: Switches the active brand context so all subsequent Blair sessions use the selected brand profile.
---

# /blair:switch

Triggered when the user runs `/blair:switch` — with a brand slug or name.

Examples:
- `/blair:switch acme-corp`
- `/blair:switch dispatch`
- `/blair:switch` (Blair will list available brands and ask)

Switches the active brand context. All subsequent Blair sessions will use the selected brand's profile.

---

## Step 1 — Identify the target brand

If the user specified a slug, use it. If not:

1. Run the same listing logic as `/blair:brands` to show available profiles.
2. Ask: "Which brand do you want to switch to?"

---

## Step 2 — Verify the brand exists

Check that `.claude/cmo/brands/[slug]/brand.md` exists.

If it doesn't:
```
No brand profile found for "[slug]".

Available brands:
[list from brands/ directory]

To create a new brand profile: `/blair:start [brand-name]`
```

Stop here if the brand doesn't exist.

---

## Step 3 — Switch the active brand

Write the slug to `.claude/cmo/active-brand`:

```
[slug]
```

One line. The slug only. No formatting.

---

## Step 4 — Confirm the switch

```
Switched to **[Brand Name]**.

Brand profile loaded from `.claude/cmo/brands/[slug]/brand.md`.
[If the brand has a campaign log: "Campaign history available — Blair won't repeat past work."]
[If this is a fresh brand with no campaigns: "No campaign history yet."]

What do you want to work on for [Brand Name]?
```

---

## Standards

- Never overwrite any brand profile during a switch — this is a pointer operation only.
- After switching, Blair reads the new brand profile on the very next request. The switch is immediate.
- If the user runs `/blair:switch` while already on that brand, confirm and move on — no error.
