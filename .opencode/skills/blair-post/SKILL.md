---
name: blair:post
description: Writes platform-native social posts for LinkedIn, X, or Instagram from a topic or milestone.
---

# /blair:post

Triggered when the user runs `/blair:post` — with a platform and/or topic.

Examples:
- `/blair:post linkedin`
- `/blair:post x`
- `/blair:post instagram`
- `/blair:post linkedin we just shipped dark mode`
- `/blair:post "we hit 1000 customers"`
- `/blair:post` (Blair will ask)

This is the fast path. No campaign brief, no strategy phase — just a post, written well, in the brand voice, ready to publish.

---

## Step 1 — Orient

Read `.claude/cmo/brand.md` (or the active brand profile in multi-brand mode). Voice, tone, and hard bans are mandatory inputs — a post without brand voice is just noise.

If `brand.md` is missing: spawn `blair-brief` first.

---

## Step 2 — Identify platform and topic

**Platform:** LinkedIn, X (Twitter), Instagram, Facebook, or Threads. If not specified, ask:

> "Which platform — LinkedIn, X, or somewhere else?"

**Topic:** What the post is about. If not specified, ask:

> "What's the post about — a product update, a milestone, a thought, or something else?"

One question at a time. If both are missing, ask platform first.

---

## Step 3 — Write platform-native

Spawn `blair-content` with this handoff context:

```
HANDOFF CONTEXT — /blair:post
Brand profile: [paste full brand.md]
Platform: [LinkedIn / X / Instagram / Facebook / Threads]
Topic: [what the user wants to post about]
Task: Write ONE post for [platform]. Platform-native format only.

Platform rules:
- LinkedIn: 3-5 short paragraphs. Hook in line 1 (no "I'm excited to share"). No hashtag wall. Optional CTA at end.
- X: Under 280 characters for single tweet, or a thread (numbered, 4-8 tweets) if the topic needs room.
- Instagram: Caption under 150 words. Strong visual hook in line 1. 3-5 relevant hashtags at end.
- Facebook: Conversational, slightly longer. No corporate tone. Question at end drives engagement.
- Threads: Short, punchy. Under 500 characters. Opinion or hot take preferred.

Do not write multiple options. Write one. Make it the right one.
Check hard bans from brand.md — any violation disqualifies the draft.
```

---

## Step 4 — Deliver with quick options

After the post:

```
---
Want to adjust?
- "Make it shorter" / "Make it longer"
- "More [bold/casual/technical/story-driven]"
- "Write a thread version" (if platform is X)
- "Write 3 variations" (if you want to pick the best one)
```

---

## Standards

- One post. Not a list of options by default. Users who want options can ask.
- Platform-native means respecting the culture and format of each network — a LinkedIn post that reads like a tweet fails, and vice versa.
- Never start a LinkedIn post with "I'm excited to announce" or "Thrilled to share."
- Never start any post with "In today's fast-paced world."
- Hard bans from brand.md are absolute — check before delivering.
- If the brand voice profile is thin, write conservatively — better a clean post than a misfire.
