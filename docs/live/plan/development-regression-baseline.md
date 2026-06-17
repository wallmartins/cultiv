# Development regression baseline

Argument Development Signature drift is validated against the shared reasoning-regression persona corpus in `tests/fixtures/reasoning-regression/`.

Each persona includes:

- `argumentDevelopmentSignature` — expected development profile
- `developmentBadCandidates` — texts that should score below 80 on development drift

## Run locally

```bash
pnpm eval:development
pnpm test tests/reasoning-regression/development-regression.test.ts
```

## Thresholds

- At least **6 personas** with development signatures
- Every `developmentBadCandidates` entry must score **&lt; 80** on `evaluateArgumentDevelopmentDrift` at the `draft` step

## When to update

Update fixtures and this baseline when:

- Development drift heuristics change materially
- New epistemic postures or structural anti-patterns are added
- A persona's expected development arc is refined after extraction tuning
