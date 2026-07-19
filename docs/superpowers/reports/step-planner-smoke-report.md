# Step planner smoke report

Generated: 2026-06-22T14:18:27.438Z

## Summary

- Dry scenarios: 5/5 passed
- HTTP scenarios: 0/5 passed

## Prerequisites (HTTP mode)

- `COMPOSITOR_V1_ENABLED=true` and `STEP_PLANNER_V1_ENABLED=true` on API + worker
- `.env` at repo root with `CALIBRATION_ACCESS_TOKEN`, `DATABASE_URL`
- Optional: `CALIBRATION_BASE_URL` (default `http://127.0.0.1:3001`)

## Dry-run planner assertions

| Scenario | Pass | Patches | Ops | Final plan |
|----------|------|---------|-----|------------|
| engage-audience-no-question | yes | 1 | removeStep:hook | short-piece |
| explain-deeply-short-briefing | yes | 2 | removeStep:research, removeStep:outline | long-piece |
| document-decision-heavy-context | yes | 1 | insertStep:structure:before:draft | edition-piece |
| tell-story-stable | yes | 0 | — | serial-piece |
| engage-audience-with-question | yes | 0 | — | short-piece |

## HTTP execution

Live preview + execute against the running API.

| Scenario | Pass | Preview plan | Quota cost | Job | Status | USD est. | Planner patches |
|----------|------|--------------|------------|-----|--------|----------|-----------------|
| engage-audience-no-question | **no** | — | — | — | — | — | — |
| explain-deeply-short-briefing | **no** | — | — | — | — | — | — |
| document-decision-heavy-context | **no** | — | — | — | — | — | — |
| tell-story-stable | **no** | — | — | — | — | — | — |
| engage-audience-with-question | **no** | — | — | — | — | — | — |

### HTTP failures

- **engage-audience-no-question**: preview 401: {"status":401,"code":"authentication_expired_token","category":"authentication","message":"JWT is expired","retryable":false,"details":{"route":"POST /api/generation-preview","reason":"expired_token","path":"/api/generation-preview"}}
- **explain-deeply-short-briefing**: preview 401: {"status":401,"code":"authentication_expired_token","category":"authentication","message":"JWT is expired","retryable":false,"details":{"route":"POST /api/generation-preview","reason":"expired_token","path":"/api/generation-preview"}}
- **document-decision-heavy-context**: preview 401: {"status":401,"code":"authentication_expired_token","category":"authentication","message":"JWT is expired","retryable":false,"details":{"route":"POST /api/generation-preview","reason":"expired_token","path":"/api/generation-preview"}}
- **tell-story-stable**: preview 401: {"status":401,"code":"authentication_expired_token","category":"authentication","message":"JWT is expired","retryable":false,"details":{"route":"POST /api/generation-preview","reason":"expired_token","path":"/api/generation-preview"}}
- **engage-audience-with-question**: preview 401: {"status":401,"code":"authentication_expired_token","category":"authentication","message":"JWT is expired","retryable":false,"details":{"route":"POST /api/generation-preview","reason":"expired_token","path":"/api/generation-preview"}}

