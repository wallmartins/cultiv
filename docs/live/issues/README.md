# Cultiv Rebranding — Issue Tracker

12 vertical slices for the complete Cultiv identity redesign.

## Dependency Graph

```
01 Logo & Brand Mark ──────────┬──→ 05 Marketing Components ──→ 07 Motion
                               │
02 Design Tokens ──────────────┤──→ 06 Illustrations & Scenes
                               │
03 Marketing Copy (pt-BR) ─────┤──→ 04 Marketing Copy (en)
                               │
08 Workspace Copy (pt-BR) ─────┤──→ 09 Workspace Copy (en)
                               │
                               ├──→ 10 Workspace Shell
                               │
                               └──→ 11 Workspace Screens ──→ 12 SEO & Final Audit
```

## Issues

| # | Title | Type | Blocked By | File |
|---|-------|------|------------|------|
| 01 | Logo & Brand Mark Redesign | AFK | — | [01](01-logo-brand-mark-redesign.md) |
| 02 | Design Token Refresh | AFK | 01 | [02](02-design-token-refresh.md) |
| 03 | Marketing Copy Rewrite (pt-BR) | HITL | 02 | [03](03-marketing-copy-pt-br.md) |
| 04 | Marketing Copy Rewrite (en) | HITL | 03 | [04](04-marketing-copy-en.md) |
| 05 | Marketing Surface Components Refresh | AFK | 01, 02, 03 | [05](05-marketing-surface-components.md) |
| 06 | Marketing Illustrations & SVG Scenes | AFK | 02 | [06](06-marketing-illustrations-scenes.md) |
| 07 | Marketing Motion & Animation Refinement | AFK | 05 | [07](07-marketing-motion-animation.md) |
| 08 | Workspace Copy Rewrite (pt-BR) | HITL | 02 | [08](08-workspace-copy-pt-br.md) |
| 09 | Workspace Copy Rewrite (en) | HITL | 08 | [09](09-workspace-copy-en.md) |
| 10 | Workspace Shell & Navigation Refresh | AFK | 01, 02, 08 | [10](10-workspace-shell-navigation.md) |
| 11 | Workspace Screen Refresh | AFK | 02, 08 | [11](11-workspace-screens-refresh.md) |
| 12 | SEO, Structured Data & Final Audit | AFK | 03, 04, 05, 10, 11 | [12](12-seo-audit-final.md) |

## Execution Order

**Week 1-2:** Issues 01, 02 (foundation)
**Week 2-3:** Issues 03, 08 (copy — HITL, can run in parallel)
**Week 3-4:** Issues 04, 09 (copy — depend on 03, 08)
**Week 3-5:** Issues 05, 06, 10, 11 (visuals — depend on tokens + copy)
**Week 5-6:** Issue 07 (motion — depends on components)
**Week 7-8:** Issue 12 (final audit — depends on everything)
