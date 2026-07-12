---
name: blair:repurpose
description: Repurpose one asset across every channel. Give Blair a blog post, talk, podcast, LinkedIn post, or any content — get platform-native versions for LinkedIn, X, email, newsletter, video script, and more.
---

# Blair: Repurpose

Turn one piece of content into a full channel set. Blair extracts every distinct idea from your source asset and adapts each one natively for every channel you're on.

## What you get

- **Atom extraction** — every distinct insight, proof point, story, and claim pulled from the source
- **Platform-native outputs** — each output written for how that platform actually works, not copy-pasted
- **Unused atoms list** — leftover ideas you can use for future posts

## How to use

Provide the source asset in any of these ways:
- Paste the text directly
- Share a URL (Blair will fetch it)
- Describe what it is and what it covers

```
/blair:repurpose [paste content or URL]
/blair:repurpose linkedin   → repurpose specifically for LinkedIn only
/blair:repurpose email      → repurpose into email sequences only
```

## Instructions

Check `.claude/cmo/brand.md` first. If it doesn't exist, tell the user to run `/blair:start`.

If brand.md exists, get the source asset from the user if they haven't provided it:
> "What do you want to repurpose? Paste the content, share a URL, or describe it."

Then spawn `blair-repurpose` with:

> Repurpose the following asset for [brand name]. Brand profile is in `.claude/cmo/brand.md`. Active channels: [list from brand profile]. [If user specified a single channel: produce only that channel's output.] Source asset: [content or URL]. Extract all atoms, rank them, and produce platform-native outputs for each active channel.

If a URL was provided, instruct `blair-repurpose` to fetch and read it fully before extracting atoms.

After delivery, offer: "Want me to add these to your content calendar, or write more variations on any of the unused atoms?"
