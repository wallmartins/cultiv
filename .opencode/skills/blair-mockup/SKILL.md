---
name: blair:mockup
description: Generate visual HTML mockups — ads, email templates, landing page sections, social graphics, OG images. Written directly to .claude/cmo/visuals/ and previewable in any browser.
---

# /blair:mockup

Triggered when the user runs `/blair:mockup` or asks for any visual creative asset.

---

## What you can create

| Request | What Blair builds |
|---------|------------------|
| `/blair:mockup ad linkedin` | 1200x628 LinkedIn ad — opens in browser |
| `/blair:mockup ad instagram` | 1080x1080 Instagram square ad |
| `/blair:mockup ad story` | 1080x1920 story format |
| `/blair:mockup email welcome` | Production-ready HTML email template |
| `/blair:mockup hero` | Landing page hero section (responsive) |
| `/blair:mockup pricing` | Pricing section with your tiers |
| `/blair:mockup social` | Social post graphic (1080x1080) |
| `/blair:mockup og` | OG/meta image for link previews |

Or just describe what you need: "mockup a cold email template" or "build me an ad for our LinkedIn campaign."

---

## Instructions

**Step 1: Read brand.md**

Read `.claude/cmo/brand.md`. If it doesn't exist, tell the user to run `/blair:start` first.

**Step 2: Parse the request**

Identify:
- Asset type (ad / email / landing page section / social / OG)
- Platform or format (LinkedIn / Instagram / story / email / hero / pricing / etc.)
- Any specific copy or messaging provided inline

**Step 3: Get copy**

If the user provided copy inline — use it directly.

If no copy was provided — spawn `blair-copy` to generate the copy first:

```
## Blair Handoff — Copy for Visual

### Brand Profile
[full contents of .claude/cmo/brand.md]

### Asset
[asset type and platform]

### Task
Write the copy for this visual asset: headline, subheadline (if needed), body (if needed), and CTA. Keep it tight — visual assets have strict character limits. Return copy only, ready to place.
```

**Step 4: Spawn blair-visual**

Once copy is ready, invoke `blair-visual` with:

```
## Blair Handoff — Visual Mockup

### Brand Profile
[full contents of .claude/cmo/brand.md]

### Asset type
[ad / email / section / social / OG]

### Format / dimensions
[e.g. LinkedIn 1200x628, Instagram 1080x1080, email 600px wide]

### Copy
[copy from Step 3 or user-provided]

### Output path
.claude/cmo/visuals/

### Task
Build the HTML mockup. Write the file to disk. Return the file path and preview instructions.
```

**Step 5: After delivery**

Report back to the user:
- What file was created and where
- How to preview it ("open in any browser")
- Offer variations: "Want a different size, different headline, or dark/light version?"
- Offer spec export: "Need to hand this to a designer? Say 'export specs' and I'll add a spec sheet."
