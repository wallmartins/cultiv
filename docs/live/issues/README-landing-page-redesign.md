# Landing Page Redesign — Issue Tracker

17 vertical slices for the Cultiv landing page redesign.

## Dependency Graph

```
117 Copy Rewrite (pt-BR) ──────┬──→ 118 Copy Rewrite (en)
                                │
                                ├──→ 119 Navigation Rename
                                │
                                ├──→ 120 Hero Section Rewrite ──→ 123 Demo Integration ──→ 133 Founder Video
                                │         │
                                │         └──→ 124 Problem Section
                                │
                                ├──→ 125 Comparison Section (3 cols)
                                │
                                ├──→ 126 Pricing Section (3 plans)
                                │
                                ├──→ 128 Testimonial Section
                                │
                                ├──→ 129 FAQ Section
                                │
                                ├──→ 130 Footer Rewrite
                                │
                                ├──→ 131 OG Image ──→ 132 SEO Metadata
                                │
                                └──→ 127 Pricing Backend Update

121 Text Analyzer Logic ──→ 122 Metrics Display ──→ 123 Demo Integration
```

## Issues

| # | Title | Type | Blocked By | File |
|---|-------|------|------------|------|
| 117 | Landing Page Copy Rewrite (pt-BR) | HITL | — | [117](117-landing-page-copy-pt-br.md) |
| 118 | Landing Page Copy Rewrite (en) | AFK | 117 | [118](118-landing-page-copy-en.md) |
| 119 | Navigation Rename | AFK | 117 | [119](119-navigation-rename.md) |
| 120 | Hero Section Rewrite | AFK | 117, 119 | [120](120-hero-section-rewrite.md) |
| 121 | Interactive Demo: Text Analyzer Logic | AFK | — | [121](121-interactive-demo-text-analyzer.md) |
| 122 | Interactive Demo: Metrics Display Component | AFK | 121 | [122](122-interactive-demo-metrics-display.md) |
| 123 | Interactive Demo: Section Integration | AFK | 120, 122 | [123](123-interactive-demo-section-integration.md) |
| 124 | Problem Section Rewrite | AFK | 117 | [124](124-problem-section-rewrite.md) |
| 125 | Comparison Section (3 Columns) | AFK | 117 | [125](125-comparison-section-3-columns.md) |
| 126 | Pricing Section (3 Paid Plans) | AFK | 117 | [126](126-pricing-section-3-paid-plans.md) |
| 127 | Pricing Catalog Backend Update | AFK | 117 | [127](127-pricing-catalog-backend-update.md) |
| 128 | Testimonial Section (3 Named) | AFK | 117 | [128](128-testimonial-section-3-named.md) |
| 129 | FAQ Section Update | AFK | 117 | [129](129-faq-section-update.md) |
| 130 | Footer Rewrite | AFK | 117 | [130](130-footer-rewrite.md) |
| 131 | OG Image Creation | AFK | 117 | [131](131-og-image-creation.md) |
| 132 | SEO Metadata Update | AFK | 117, 131 | [132](132-seo-metadata-update.md) |
| 133 | Founder Video Section | HITL | 120, 123 | [133](133-founder-video-section.md) |

## Execution Order

**Phase 1 — Foundation (no blockers):**
- 117 Copy Rewrite pt-BR (HITL — requires copy approval)
- 121 Text Analyzer Logic (AFK — pure logic, no UI)

**Phase 2 — Dependent on copy (parallelizable):**
- 118 Copy Rewrite en
- 119 Navigation Rename
- 120 Hero Section Rewrite
- 124 Problem Section
- 125 Comparison Section
- 126 Pricing Section
- 127 Pricing Backend
- 128 Testimonial Section
- 129 FAQ Section
- 130 Footer Rewrite
- 131 OG Image

**Phase 3 — Dependent on Phase 2:**
- 122 Metrics Display (depends on 121)
- 132 SEO Metadata (depends on 131)

**Phase 4 — Integration:**
- 123 Demo Integration (depends on 120, 122)
- 133 Founder Video (depends on 120, 123 — HITL, needs video recording)

## Total Issues: 17

- HITL: 2 (117, 133)
- AFK: 15
