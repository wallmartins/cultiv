---
target: apps/web/src/marketing/
total_score: 33
p0_count: 1
p1_count: 2
timestamp: 2026-07-05T03-25-36Z
slug: apps-web-src-marketing
---
## Critique: Cultiv Landing Page

Method: dual-agent (A: design review · B: detector scan)

### Design Health Score

| # | Heuristic | Score | Key Issue |
|---|-----------|-------|-----------|
| 1 | Visibility of System Status | 3/4 | No scroll-spy on nav, no "back to top" affordance |
| 2 | Match System / Real World | 4/4 | "Voice as territory" metaphor consistent; copy speaks author language |
| 3 | User Control and Freedom | 3/4 | Good reset in demo; no section-jump shortcuts |
| 4 | Consistency and Standards | 4/4 | Uniform utility class vocabulary, consistent layout patterns |
| 5 | Error Prevention | 3/4 | Demo has min-length gate; no destructive actions to guard |
| 6 | Recognition Rather Than Recall | 4/4 | All labels explicit, comparisons direct, metrics visible |
| 7 | Flexibility and Efficiency | 2/4 | No scroll-spy, no keyboard shortcuts, no search in FAQ |
| 8 | Aesthetic and Minimalist Design | 4/4 | Restrained pigment, no decorative shadows, signature wave loader |
| 9 | Error Recovery | 3/4 | Only demo has error surface; adequate for marketing page |
| 10 | Help and Documentation | 3/4 | FAQ covers 6 questions; no search, no inline tooltips |
| **Total** | | **33/40** | **Good — solid foundation, address weak areas** |

### Anti-Patterns Verdict

**LLM assessment:** Two slop markers found, both borderline:

1. **Side-stripe border** — `ManifestoSection.tsx:62`: `border-l-[3px] border-l-terracotta` on the "good" comparison card. DESIGN.md explicitly bans `border-left > 1px as accent in cards`. Fix: remove the left border, use a background tint or top border instead.

2. **Numbered section markers (01/02/03/04)** — `HowItWorksSection.tsx:85-86`: Large amber step numbers using `padStart(2, "0")`. Mitigated: the section IS a sequential process where order carries information, so numbering is semantically earned. But the oversized display numerals in amber are a known slop pattern. Keep the numbers but reduce their visual weight.

All other 11 slop markers are clean.

**Deterministic scan:** The detector found zero issues across the marketing source files (expected — detector targets compiled output, not TSX source).

### Overall Impression

The landing page is well-constructed and follows DESIGN.md with discipline. The terracotta-accent strategy works, the breather sections create genuine rhythm, and the wave-loader is a distinctive signature loader. The page avoids the dominant SaaS landing clichés. **But one systemic problem undermines everything: secondary text is unreadable.** `--color-ink-muted` (#989593) against `--color-paper` (#F8F5F0) fails WCAG AA and is used on nearly every section. This is a ship-blocker, not a polish item.

### What's Working

- **Brand voice in the hero:** "Sua voz não é um dado. É território." is distinctive poetry — not SaaS copy. The preview card with metric chips delivers concrete proof immediately.
- **Tonal rhythm:** Paper → warm-tinted → paper → cream-tinted → paper → earth → paper creates breathing room without decoration.
- **Consistency discipline:** Every section shares the same spacing, surface, and button vocabulary.

### Priority Issues

**[P0] Muted text fails WCAG AA contrast everywhere.** `--color-ink-muted` (#989593) on `--color-paper` (#F8F5F0) has an estimated contrast ratio of ~2.5:1 — well below 4.5:1. This is used for subheadlines, descriptions, card labels, pricing features, footer links. On dark backgrounds (How It Works, Pricing), `opacity-80` modifiers drive contrast even lower. Fix: darken `--color-ink-muted` to approximately #6B6560 (≈4.7:1 on paper). Remove opacity modifiers on dark sections.
**Suggested command:** `$impeccable colorize /marketing` with focus on secondary text contrast.

**[P1] Body font mismatch from DESIGN.md spec.** DESIGN.md specifies Inter as the body font; the implementation uses DM Sans. DM Sans has geometric DNA close to Sora (display), reducing typographic contrast. The intended pairing was geometric (Sora) + humanist (Inter) + serif (Merriweather).
**Suggested command:** `$impeccable typeset /marketing` to resolve font selection.

**[P1] Missing `text-wrap: pretty` on reading text.** `.text-reading` and `.text-reading-sm` don't apply `text-wrap: pretty`, which DESIGN.md requires for long paragraphs to reduce orphans.
**Suggested command:** Add `text-wrap: pretty` to theme.css reading utilities.

**[P2] Side-stripe border on Manifesto comparison card.** `ManifestoSection.tsx:62` uses `border-l-[3px] border-l-terracotta` on the "good" card. Replace with a full-border treatment or terracotta-tinted background.
**Suggested command:** `$impeccable polish ManifestoSection`.

**[P2] Emotional valleys at MetricsShowcase and Comparison.** Metrics section (6 identical cards) and Comparison table (6-0 victory) break narrative momentum. CTA Strip doesn't build to a crescendo.
**Suggested command:** `$impeccable bolder MetricsShowcase` or `$impeccable distill ComparisonSection`.

### Persona Red Flags

**Jordan (First-Timer):** Muted text everywhere creates a literal readability barrier. FAQ has only 6 items and no search. No visible trust signals before pricing.

**Riley (Stress Tester):** Demo "analyzes" text with client-side heuristics — nonsensical input produces nonsensical metrics. Pricing currency toggle doesn't persist on reload.

**Casey (Distracted Mobile):** Comparison table may cramp at 320px. Hero visual panel dominates mobile viewport, pushing CTAs below fold. No "back to top" after 13+ sections.

### Minor Observations

- MetricsShowcase has the heaviest terracotta concentration on the page (6 dots + 6 bars) — consider reducing to 3 visible + expand.
- Footer legal routes use `/privacy` and `/terms` — URL-to-label mismatch in Portuguese.
- Demo loading delay (1.8s static) feels scripted — consider randomized timing or server-backed endpoint later.

### Questions to Consider

- "What if the breather sections varied their internal structure instead of repeating line → divider → sub?"
- "What would a MetricsShowcase that truly proves voice capture look like?"
- "Does the Comparison need to win 6-0, or would acknowledging one honest trade-off build more trust?"
