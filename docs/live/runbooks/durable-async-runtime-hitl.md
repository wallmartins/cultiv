# Durable Async Runtime — Checklist HITL (issue 57)

Runbook for manual sign-off of the Durable Async Runtime program. Automated coverage lives in `pnpm test:durable`; this document covers operational verification.

**Related:** [Production go-live](./production-go-live.md) · [ADR 0004](../../adr/0004-durable-async-runtime-zero-in-process-state.md) · [issue 57](../issues/57-restart-multi-replica-verification-gate.md)

---

## Prerequisites

| Requirement | Command / value |
|-------------|-----------------|
| Node 20+, pnpm | `node -v`, `pnpm -v` |
| Docker | `docker compose version` |
| Repo env | `cp .env.example .env` and set `GEMINI_API_KEY` (or another provider) |
| Durable mode | `DATABASE_URL` + `REDIS_URL` set; **do not** set `BACKEND_ALLOW_IN_MEMORY_RUNTIME=true` |
| Async path | `EXECUTION_MODE=async` in `.env` for `202` enqueue smoke |

---

## 1. `docker compose` path (clean machine)

**Goal:** PostgreSQL + Redis up with healthchecks; migrations apply; API + worker start.

```bash
pnpm install
cp .env.example .env
# Edit .env: GEMINI_API_KEY, unset BACKEND_ALLOW_IN_MEMORY_RUNTIME, EXECUTION_MODE=async

docker compose up -d postgres redis
docker compose ps   # both healthy

pnpm --filter @my-ai-orchestrator/backend migrate

# Terminal A — API (outbox relay only; no BullMQ consumer in-process)
pnpm dev:backend

# Terminal B — worker
pnpm --filter @my-ai-orchestrator/backend worker
```

**Pass criteria**

- [x] `docker compose ps` shows `postgres` and `redis` healthy
- [x] `migrate` exits 0
- [x] API logs show durable runtime / relay started (no in-memory runtime warning)
- [x] Worker logs `Backend execution worker started`
- [x] `curl -s http://localhost:3001/health` returns OK (or your `PORT`)

**Sign-off:** _________________ Date: _______

---

## 2. Edge rate limit (production deploy)

**Goal:** First line of abuse defense is at the edge; app limits are secondary.

The backend enforces per-IP / per-user limits via Redis (`rate-limiter`, `usage-policy`). **Production** must also configure:

| Layer | Responsibility |
|-------|----------------|
| **CDN / WAF** (Cloudflare, AWS WAF, Vercel Firewall) | IP rate limit, bot mitigation, geo blocks, DDoS |
| **API ingress** | TLS, request size limits, timeout |
| **Backend (this repo)** | Per-user traffic policy, execution idempotency, credit gates |

**Recommended production baseline**

1. WAF rule: max N requests/min per IP on `POST /me/executions/*` (e.g. 30/min).
2. WAF rule: stricter limit on unauthenticated paths.
3. Document `RATE_LIMIT_*` env vars for app-level limits (see `apps/backend/src/config/config.ts`).
4. Redis must be reachable from all API replicas for consistent counters.

**Pass criteria**

- [ ] Runbook / deploy doc names the WAF product used (e.g. Cloudflare)
- [ ] IP rate limit rule documented with threshold
- [ ] Team knows app limits are **not** a substitute for edge protection (ADR 0004)

**Sign-off:** _________________ Date: _______

---

## 3. Redis AOF (staging / production)

**Goal:** Redis survives restarts without losing queue depth or pub/sub state needed for recovery.

**Development** (`docker-compose.yml`):

```yaml
redis:
  command: ["redis-server", "--appendonly", "yes"]
```

**Staging / production checklist**

- [x] Redis deployed with **AOF** (`appendonly yes`) or managed equivalent (ElastiCache with persistence, Redis Cloud, etc.)
- [ ] Backup / snapshot policy documented
- [ ] `REDIS_URL` in secrets manager (not committed)
- [ ] Eviction policy: `noeviction` or documented maxmemory policy (avoid silent queue loss)

**Verify locally**

```bash
docker compose exec redis redis-cli CONFIG GET appendonly
# Expected: appendonly yes
```

**Sign-off:** _________________ Date: _______

---

## 4. Rolling update — zero lost `202` executions

**Goal:** After `POST /me/executions/run` returns `202`, job state survives API process restart; worker eventually completes.

**Automated helper**

```bash
pnpm hitl:durable-smoke
```

**Manual steps** (if you prefer hands-on)

```bash
# 1. Stack running (§1): API + worker + docker compose

# 2. Seed voice + billing for test user
pnpm showcase:voice-setup --subject hitl-durable-user

# 3. Enqueue (save EXECUTION_ID from response)
export AUTH="$(pnpm -s tsx -e "
  import { createBackendTestAuthorizationHeader } from './apps/backend/src/auth.js';
  console.log(createBackendTestAuthorizationHeader({ userId: 'hitl-durable-user', subject: 'hitl-durable-user' }));
")"

curl -s -X POST http://localhost:3001/me/executions/run \
  -H "authorization: $AUTH" \
  -H "content-type: application/json" \
  -d '{"pipelineType":"validation-post","contentType":"validation-post","briefing":{"topic":"HITL","keyPoints":["restart"]}}' \
  -w "\nHTTP %{http_code}\n"

# 4. Stop API (Ctrl+C), start again — worker keeps running

# 5. State still visible
curl -s http://localhost:3001/me/executions/EXECUTION_ID -H "authorization: $AUTH" | jq .status

# 6. Wait for worker → status becomes done or failed (not lost)
```

**Pass criteria**

- [ ] `POST` returns **202** with `jobId`
- [ ] Row exists in PostgreSQL `jobs` before worker runs
- [ ] After API restart, `GET /me/executions/:id` returns same `jobId` and consistent status
- [ ] Worker completes; terminal status in PG (`done` or `failed`)
- [ ] No duplicate bill capture for same `executionId`

**Sign-off:** _________________ Date: _______

---

## 5. SDK drawer — generation across API rolling restart

**Goal:** Web app generation drawer (SSE watch) continues receiving events when the API process restarts mid-flight.

**Setup**

```bash
# .env / apps/web/.env
VITE_API_BASE_URL=http://localhost:3001
EXECUTION_MODE=async
# durable stack from §1

pnpm dev:web      # terminal C
pnpm dev:backend  # terminal A — restart this during test
pnpm --filter @my-ai-orchestrator/backend worker
```

**Steps**

1. Log in to `/app` (Auth0 or dev auth per your setup).
2. Open **Generation** and start an async run (mode that returns queued job).
3. Open the **drawer** / execution watch UI so SSE is connected.
4. While status is `queued` or `running`, **restart only the API** (`pnpm dev:backend`). Keep worker running.
5. Observe drawer: progress events should resume (new API replica subscribes via Redis pub/sub).
6. Run completes; drawer shows terminal state.

**Pass criteria**

- [ ] SSE reconnects or continues after API restart (no silent stall)
- [ ] Final status matches `GET /me/executions/:id`
- [ ] No duplicate completion UI / double credit charge

**Sign-off:** _________________ Date: _______

---

## Automated suite (CI parity)

```bash
docker compose up -d postgres redis
pnpm test:durable    # 6 integration scenarios + guard
```

**Pass criteria**

- [ ] `pnpm test:durable` green locally
- [ ] CI job `durable-runtime` green on PR

**Sign-off:** _________________ Date: _______

---

## Final gate approval (issue 57)

| Item | Status | Owner | Date |
|------|--------|-------|------|
| §1 Docker compose path | ☐ | | |
| §2 Edge rate limit documented | ☐ | | |
| §3 Redis AOF runbook | ☐ | | |
| §4 Rolling update smoke | ☐ | | |
| §5 SDK drawer restart | ☐ | | |
| Automated `test:durable` | ☐ | | |

**Program approved:** _________________ Date: _______
