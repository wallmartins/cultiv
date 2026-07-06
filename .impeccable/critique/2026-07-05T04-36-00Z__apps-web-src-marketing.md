---
target: apps/web/src/marketing/
total_score: 30
p0_count: 1
p1_count: 2
timestamp: 2026-07-05T04-36-00Z
slug: apps-web-src-marketing
---
## Critique: Cultiv Landing Page

Method: dual-agent (A: design review · B: detector scan)

### Design Health Score

| # | Heuristic | Score | Key Issue |
|---|-----------|-------|-----------|
| 1 | Visibility of System Status | 3/4 | No scroll progress indicator on 13-section page |
| 2 | Match System / Real World | 4/4 | Paper/territory metaphors coherent; language human |
| 3 | User Control and Freedom | 3/4 | Currency/dark mode persist; missing "back to top" |
| 4 | Consistency and Standards | 4/4 | Tokens applied uniformly; button hierarchy stable |
| 5 | Error Prevention | 3/4 | Demo char counter; no unsaved-text warning |
| 6 | Recognition Rather Than Recall | 4/4 | Descriptive headings; side-by-side comparison |
| 7 | Flexibility and Efficiency | 3/4 | Anchor nav + persistent prefs; no keyboard shortcuts |
| 8 | Aesthetic and Minimalist Design | 2/4 | Clean per-section but 13 sections creates fatigue |
| 9 | Error Recovery | 2/4 | Clear demo state; FAQ clipped answers lack fallback |
| 10 | Help and Documentation | 2/4 | 6 FAQ items but marketing-flavored; no docs link |
| **Total** | | **30/40** | **Good** |

### Anti-Patterns Verdict

YES (moderate). Five slop markers: glass/blur header, single fabricated-feeling testimonial, "14 métricas" repeated across 4 sections, scroll reveals on every section, dark mode toggle on marketing. Deterministic scan: 1 false positive (progress bar width transition).

### Overall Impression

The page is well-crafted. The color + typography system is genuinely distinctive. But section bloat undermines everything — 13 sections with 3 redundant ones creates scroll fatigue. A visitor convinced by section 5 still has 8 more to scroll through.

### What's Working

- Color + typography system: terracotta ≤10%, three-font hierarchy, color-mix(in oklch) for tints
- Interactive demo: clean state machine, cycling loading messages, product-led growth
- BreatheSection: structural breathing markers create rhythm

### Priority Issues

[P0] Section bloat — 13 sections, 3 redundant (Demo/Metrics/Comparison all about voice metrics). Cut stats BreatheSection, merge MetricsShowcase into Demo result state. Target: 8-9 sections.

[P1] Hero h1 font-weight conflict: text-display sets 700, inline style overrides to 800.

[P1] Single testimonial reads as fabricated: no photo, no verifiable identity.

[P2] FAQ-before-CTA undermines climax: answering objections then re-asking for the sale.

[P2] DESIGN.md ink-muted mismatch: spec #989593 vs implementation #6B6560. Implementation is correct (passes WCAG AA).

### Persona Red Flags

Jordan (First-Timer): Section fatigue after HowItWorks. Repeated "14 métricas" reads as marketing repetition.
Riley (Stress Tester): Single testimonial with no validation trips skepticism. Demo analysis is client-side heuristics.

### Questions to Consider

"What if the page had 8 sections instead of 13?"
"What if the demo result became the MetricsShowcase — proving the claim instead of stating it three times?"
"What if the testimonial had faces, names, and roles from real users?"
