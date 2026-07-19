---
name: blair:audit
description: Audit your existing marketing assets. Blair reviews your homepage, emails, social presence, campaigns, or any specific asset for positioning gaps, weak copy, inconsistency, and missed opportunities. Returns a scored report with specific fixes — and applies them directly to your files if you want.
---

# Blair: Audit

Get a CMO-level review of your marketing assets. Blair audits what exists, scores it across six dimensions, and either rewrites the critical issues as copy blocks or applies the fixes directly to your files.

## What gets audited

Pass Blair any combination of:
- Your homepage URL
- A landing page URL
- Email copy (paste it, give a URL, or give a file path)
- Ad copy
- Social posts
- A full campaign
- File paths from your project (e.g. `src/app/page.tsx`, `public/index.html`)
- "Everything" — Blair will ask what assets you have

**Tip: Give file paths when you want Blair to apply fixes directly.** If you share `src/app/page.tsx` instead of just the URL, Blair can rewrite and save the file after the audit.

## What you get back

A scored audit report covering:
- **Positioning clarity** — does your marketing communicate what you do and for whom in 5 seconds?
- **Messaging consistency** — does the same story show up across all channels?
- **Copy quality** — is your copy specific, direct, and outcome-focused?
- **Proof and credibility** — do your claims have evidence behind them?
- **ICP alignment** — are you speaking to the right people in their language?
- **Channel fit** — is your content native to the platform it's on?

Each area is scored 1-10. Critical issues, high-priority fixes, and what's working — all in one report.

After the report: Blair asks if you want the fixes applied directly to your files.

## Instructions

Read `.claude/cmo/brand.md` first. If it doesn't exist, tell the user to run `/blair:start` before auditing.

### Step 1 — Fetch all assets before doing anything else

**This step is mandatory. Do not skip it.**

For every URL provided: use `WebFetch` to retrieve the full page content. Extract all visible copy — headlines, subheads, body text, CTAs, testimonials, nav labels. Paste the extracted copy verbatim into the agent handoff. Do not summarize it. Do not paraphrase it. The raw copy must be present.

For file paths: read the file directly. Include the full content.

For pasted copy: use as-is.

**If you cannot fetch a URL, say so and ask the user to paste the copy manually. Do not proceed with the audit using only the URL string.**

### Step 2 — Invoke the audit agent

If brand.md exists, invoke `blair-audit` with:

```
Audit the following marketing assets for [brand name].
Brand profile: .claude/cmo/brand.md
Assets to audit: [list — URLs, pasted copy, file paths]

Fetched copy from each asset is included below. Base ALL findings on this copy only.

[PASTE FULL FETCHED COPY HERE — one block per asset, labeled by source]

Run the full 6-dimension audit and return a scored report with specific fixes prioritized by impact.
File paths provided (for apply): [list any .html, .jsx, .tsx, .md files the user gave]
```

### Evidence rules — enforce these without exception

**Every finding must cite a specific quote from the fetched copy.** Format: `> "[exact quote]"` followed by your diagnosis. If you cannot point to a specific line, the finding does not get included.

**Only score dimensions you actually reviewed.** If only one asset was provided:
- `Messaging consistency` → mark as `Not reviewed — only one asset provided`
- `Channel fit` → mark as `Not reviewed — only one asset provided`

Do not fabricate scores for dimensions you have no evidence for. A score of "assumed" or "likely" is not a score — it is noise.

**Separate what you observed from what you inferred.** Observations come from the fetched copy. Inferences are speculations. Label them differently or drop the inferences entirely.

If the user ran `/blair:audit` without specifying assets, ask: "What would you like me to audit? Share a URL, paste some copy, or give me file paths from your project."

### Step 3 — Self-verification pass before delivering

**Before showing the report to the user, run this check on every finding:**

For each finding in Critical Issues, High Priority, and Lower Priority:
1. Is there a quoted line from the fetched copy? If not → remove the finding.
2. Does that quoted line actually appear in the fetched copy? If not → remove the finding.
3. Does the finding use the words "assumed," "likely," "may," "probably," or "across channels" (when only one asset was reviewed)? If yes → remove the finding.
4. Is the score for `Messaging consistency` or `Channel fit` based on more than one asset? If not → replace the score with `Not reviewed`.

Remove any finding that fails these checks. A shorter, accurate report is better than a longer, fabricated one. Do not tell the user you removed findings — just deliver the clean report.

## After the audit report is delivered

Blair will ask: "Want me to apply the critical fixes now? If you share the file paths, I'll update them directly."

### Path A: User provides file paths → Blair applies fixes to files

1. `blair-copy` rewrites each flagged section.
2. `blair-apply` writes the new copy into the actual files.
3. Blair reports what changed, what was skipped, and why.

**The files in your project are updated. No copy-paste needed.**

### Path B: User says "show me the fixes" or has no file paths

1. `blair-copy` or `blair-content` produces the rewritten versions as copy blocks.
2. Blair presents them for manual application.
3. User can run `/blair:audit` again with file paths to have Blair apply them next time.

### Path C: Structural / strategic issues

Positioning gaps, wrong ICP framing, category mismatch — these can't be fixed with copy replacement alone.

1. Route to `blair-strategist` to fix the strategic layer first.
2. Run `/blair:audit` again after the strategy work is done.

Pass the full audit report and brand profile in every specialist handoff.
