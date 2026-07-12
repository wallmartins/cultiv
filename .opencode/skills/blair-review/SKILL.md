---
name: blair:review
description: Scored copy review with line-by-line diagnosis and brand-accurate rewrites for any marketing asset.
---

# /blair:review

Triggered when the user runs `/blair:review` — optionally with a specific asset or URL.

Examples:
- `/blair:review`
- `/blair:review [paste your copy here]`
- `/blair:review homepage`
- `/blair:review our latest email`
- `/blair:review the campaign we just ran`

---

## Step 1 — Orient

Read `.claude/cmo/brand.md`. This is the scoring rubric — the review is always relative to the brand's stated positioning, ICP, voice, and goals.

If `brand.md` is missing: run `blair-brief` first. A review without a standard is just opinion.

Also read `.claude/cmo/insights.md` if it exists — prior reviews inform pattern recognition.

---

## Step 2 — Identify what to review

If the user pasted content directly, use it.
If the user named an asset type (homepage, email, ad, etc.), ask them to paste it.
If the user referenced a URL, use WebFetch to retrieve the page content.

Ask once:

> "Paste the copy or share the URL — I'll review it against your brand profile."

---

## Step 3 — Route to blair-audit

Spawn `blair-audit` with the content and this handoff context:

```
HANDOFF CONTEXT — /blair:review
Brand profile: [paste full brand.md]
Asset type: [homepage / email / ad / landing page / social post / pitch deck / other]
Content to review: [paste the content verbatim]
Task: Score this asset across all 6 audit dimensions. Be specific — cite the exact lines that fail and write exact replacement suggestions, not directional advice.

If this is a single asset (not a full marketing audit), focus the diagnosis on:
- Does this speak to the ICP?
- Does the copy reflect the positioning in brand.md?
- Is the CTA clear and friction-free?
- Does the voice match brand.md?
- Is there a specific, credible proof point?
```

---

## Step 4 — Deliver scored review

The review output format:

```
# Copy Review — [Asset type] — [Date]

## Overall score: [N/10]
[One sentence verdict: what this copy does well and what's holding it back]

---

## Line-by-line diagnosis

### What's working
- **"[Exact quote]"** — [Why it works — specific mechanism]

### What's not working
- **"[Exact quote]"** — [Why it fails — specific diagnosis, not vague advice]
  → Replace with: "[Specific rewrite]"

---

## Quick fixes (high impact, low effort)
1. [Change X to Y — exact swap]
2. [Change X to Y — exact swap]
3. [Change X to Y — exact swap]

---

## If you want to go further
[The single most important structural change — headline, structure, or offer — that would make the biggest difference]
```

---

## Step 5 — Offer to fix it

After the review:

```
Want me to rewrite this?
- "Fix the quick wins" → rewrites the 3 easy swaps
- "Rewrite the whole thing" → full asset rewrite via blair-copy
- "A/B test version" → writes an alternate angle to test against
```

---

## Standards

- Every criticism must have a specific replacement — "this is weak" without a fix is not a review.
- Scores must be relative to the brand's own goals and ICP, not a generic ideal.
- If the copy is actually good, say so — and say specifically why. Positive reviews are as valuable as negative ones.
- If the asset has no clear CTA, flag it as a critical issue regardless of how good the copy is.
