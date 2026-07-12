---
name: blair:sequence-from-list
description: Turn a prospect CSV (from Seamless.AI, Apollo, LinkedIn, or any export) into segmented cold outbound sequences. Maps columns once and remembers the mapping, segments by title pattern, generates full sequences per segment via blair-outbound, and writes import-ready CSV files alongside the source.
---

# /blair:sequence-from-list

Triggered when the user runs `/blair:sequence-from-list [file path]`.

Examples:
- `/blair:sequence-from-list prospects.csv`
- `/blair:sequence-from-list ~/Downloads/seamless-export.csv`
- `/blair:sequence-from-list` (Blair will ask for the path)

---

## Execution

**Step 1: Read brand profile**

Check `.claude/cmo/brand.md`. If it does not exist, say:
> "Run `/blair:start` first so Blair knows your brand before building sequences."
Stop here.

**Step 2: Get CSV path**

If the user provided a file path in the command arguments, use it.

If not, ask:
> "What's the path to your prospect CSV? (e.g., `~/Downloads/seamless-export.csv`)"

Wait for the answer.

**Step 3: Read the CSV**

Read the file at the provided path. If the file does not exist or is not readable, say:
> "Can't read that file. Check the path and try again — or paste the CSV content directly here."

Extract the header row and up to 200 data rows. If the file exceeds 200 rows, notify the user:
> "Your list has [N] rows. Blair will process the first 200. For larger lists, split the file and run again."

**Step 4: Column mapping**

Check `.claude/cmo/column-mappings.md` for a saved map that matches this file's column headers.

Spawn **`blair-list-processor`** with this handoff:

```
## Blair List Processor Handoff — Column Mapping

### CSV Headers
[comma-separated header row from file]

### Column Mappings File
[full contents of .claude/cmo/column-mappings.md if it exists, else "none"]

### Task
Resolve column mapping. Use a saved map if one matches. If no match, walk through interactive mapping with the user and save the result to .claude/cmo/column-mappings.md.
```

Wait for `blair-list-processor` to return a resolved column map.

**Step 5: Segmentation**

Spawn **`blair-list-processor`** again with this handoff:

```
## Blair List Processor Handoff — Segmentation

### Column Map (resolved)
[map returned in Step 4]

### Prospect Data (mapped)
[CSV rows re-mapped to Blair standard fields: first_name, last_name, email, company, title, trigger]

### Task
Segment these prospects into 2-5 named cohorts by title pattern. Return a segment manifest with counts and title patterns per segment.
```

Wait for the segment manifest.

**Step 6: Generate sequences**

For each segment in the manifest, spawn **`blair-outbound`** with this handoff:

```
## Blair Handoff — Cold Outbound (sequence-from-list)

### Brand Profile
[full contents of .claude/cmo/brand.md]

### User Request
Build a full cold outbound sequence for a specific prospect segment from a CSV list.

### Target Segment
Name: [segment name]
Count: [N prospects]
Title patterns: [from manifest]

### Personalization Tokens
Use these tokens in your copy. They will be replaced with real values from the CSV:
- {{first_name}} — prospect's first name
- {{company}} — prospect's company name
- {{title}} — prospect's job title
- {{trigger}} — prospect trigger or signal (if present in data; otherwise omit)

### Sequence Format Required
Write for CSV import. Every email subject and body must be a separate, clearly labeled value.
Tokens must appear exactly as shown above — no variations.

Write:
- 7-touch email sequence (subject line + body for each touch)
- 5-touch LinkedIn DM sequence (body only for each touch)

### Active Sequences (do not duplicate)
[contents of .claude/cmo/pipeline.md if it exists, else "none"]
```

Collect the full sequence output for each segment before proceeding.

**Step 7: Write CSV output files**

For each segment, write an import-ready CSV file to the same directory as the source CSV.

Filename format: `blair-sequences-[segment-slug]-[YYYY-MM-DD].csv`
Segment slug: lowercase, spaces replaced with hyphens (e.g., "sales-leadership", "founders")

CSV columns in this order:
```
first_name,last_name,email,company,title,email_touch_1_subject,email_touch_1_body,email_touch_2_subject,email_touch_2_body,email_touch_3_subject,email_touch_3_body,email_touch_4_subject,email_touch_4_body,email_touch_5_subject,email_touch_5_body,email_touch_6_subject,email_touch_6_body,email_touch_7_subject,email_touch_7_body,linkedin_touch_1,linkedin_touch_2,linkedin_touch_3,linkedin_touch_4,linkedin_touch_5
```

Populate `first_name`, `last_name`, `email`, `company`, `title` from the prospect rows for that segment.
Populate sequence columns with the copy from `blair-outbound` — same values repeated for every row in the segment (tokens in place, not filled in).

**Step 8: Show chat review**

Present a human-readable summary in chat for each segment:

```
## Sequence Review

### Segment 1: Sales Leadership (23 prospects)
Source: Seamless.AI (saved map)
Output file: blair-sequences-sales-leadership-2026-04-17.csv

**Email Touch 1**
Subject: [subject line]

[full email body with {{tokens}} visible]

**Email Touch 2 — Day 3**
Subject: [subject line]

[body]

[... through Touch 7]

---

**LinkedIn Touch 1**
[message]

[... through Touch 5]

---

### Segment 2: Founders (11 prospects)
[same structure]
```

**Step 9: Log to pipeline**

Append to `.claude/cmo/pipeline.md` (create if not present):

```markdown
## Outbound Sequence — [date]
- **Command:** /blair:sequence-from-list
- **Source file:** [filename]
- **Segments:** [segment names and counts]
- **Output files:** [list of CSV filenames written]
- **Status:** Ready to import
```

**Step 10: Deliverability check**

Call `/blair:deliverability-checklist` with this preamble:
> "Before you send — quick deliverability check. Takes 2 minutes and can save your domain reputation."

Run the full 6-question flow. Do not skip this step.

---

## Edge cases

**List under 10 rows:**
If `blair-list-processor` flags a small list, offer:
> "Your list only has [N] prospects — small enough to personalize each row individually. Want me to write a custom first touch for each person instead of using tokens?"

If yes: for each row, spawn `blair-outbound` with that individual's specific name, company, title, and trigger in the handoff context for Touch 1. Touches 2-7 remain token-based for efficiency.

**No email column in mapping:**
Say:
> "No email column found. Blair will still write the sequences, but the output CSV won't have email addresses — you'll need to add them before importing."
Proceed without email column in output.

**No title column in mapping:**
Say:
> "A job title column is required for segmentation. Without it, Blair can't create targeted sequences. Map a title column or run `/blair:cold-outbound` instead for a single ICP."
Stop here.
