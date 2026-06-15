---
title: Backend Deployment Pipeline
doc_type: issue
status: ready-for-agent
domain: backend-platform
slice_type: AFK
last_updated: 2026-06-15
---

# Backend deployment pipeline

## Parent

- [`issue-integrator-cloudflare-deploy.md`](../prd/issue-integrator-cloudflare-deploy.md)
- ADR: [`0005-integrator-cloudflare-deploy.md`](../../adr/0005-integrator-cloudflare-deploy.md)

## What to build

Create a fully automated CI/CD pipeline that deploys the backend from GitHub to the Integrator VPS on every push to `main`. The pipeline must build, test, deploy, migrate, and verify.

### Deliverables

1. **PM2 ecosystem configuration**
   - `ecosystem.config.cjs` in `/home/cultiv/cultiv/app/`
   - Process 1: `cultiv-api`
     - `script`: `apps/backend/dist/cli/main.js`
     - `instances`: 1, `exec_mode: 'fork'`
     - `env`: all required environment variables (see below)
     - `max_memory_restart`: `512M`
     - `kill_timeout`: 5000 (ms for graceful shutdown)
     - `wait_ready`: true
     - `restart_delay`: 3000
   - Process 2: `cultiv-worker`
     - `script`: `apps/backend/dist/cli/worker-main.js`
     - `env`: same DB/Redis/auth vars, plus `EXECUTION_WORKER_CONCURRENCY=2`
     - `max_memory_restart`: `512M`
   - Logs: `log_file`, `out_file`, `err_file` with rotation

2. **Environment variables file**
   - `.env` in `/home/cultiv/cultiv/app/` (not committed to repo)
   - `NODE_ENV=production`
   - `HOST=127.0.0.1`, `PORT=3001`
   - `DATABASE_URL=postgresql://cultiv:<password>@127.0.0.1:5432/cultiv`
   - `REDIS_URL=redis://127.0.0.1:6379`
   - `BACKEND_TRUST_PROXY=true`
   - `OUTBOX_RELAY_INTERVAL_MS=1000`
   - `CORS_ALLOWED_ORIGINS=https://www.cultiv.app,https://cultiv.app`
   - `AUTH_ISSUER_URL`, `AUTH_AUDIENCE`, `AUTH_JWKS_URL`
   - `OPENAI_API_KEY`, `ANTHROPIC_API_KEY`, `GEMINI_API_KEY`, `DEEPSEEK_API_KEY`
   - `OLLAMA_BASE_URL=http://127.0.0.1:11434`
   - `VOICE_DATA_PROTECTION_KEY` (32+ chars)
   - `AI_POLICY_MANIFEST_PATH` (absolute path to manifest)
   - `SAFETY_POLICY_MANIFEST_PATH` (absolute path to manifest)
   - `BILLING_USER_ID`, `BILLING_PLAN_ID`
   - `RATE_LIMIT_MAX_REQUESTS=60`, `RATE_LIMIT_WINDOW_MS=60000`
   - `SERVICE_NAME=cultiv`, `APP_VERSION=0.1.0`
   - `EXECUTION_MODE=async`, `QUALITY_MODE=balanced`, `DEFAULT_LANGUAGE=pt-BR`

3. **First deploy (manual)**
   - Clone repo to VM: `git clone` (or use SCP for artifact)
   - Install dependencies: `pnpm install --frozen-lockfile`
   - Build backend: `pnpm build:backend`
   - Run migrations: `pnpm --filter @my-ai-orchestrator/backend migrate`
   - Verify schema: migrations pass + expected tables exist
   - Start PM2: `pm2 start ecosystem.config.cjs`
   - Verify: `curl http://127.0.0.1:3001/health` → 200
   - Verify via Cloudflare: `curl https://api.cultiv.app/health` → 200
   - Smoke test: end-to-end job enqueue via API, observe completion

4. **GitHub Actions workflow (self-hosted runner)**
   - Since SSH is not exposed to internet (Cloudflare Zero Trust), we use a **self-hosted GitHub Actions runner** on the Integrator VPS.
   - The runner connects to GitHub via outbound HTTPS (no inbound ports needed).
   - `.github/workflows/deploy-integrator.yml`
   - Trigger: `push` to `main`
   - Jobs:
     - `build-and-deploy` on `self-hosted` (runs on the Integrator VPS)
     - Steps:
       1. Checkout code
       2. Setup pnpm (11.3.0)
       3. Setup Node.js 22
       4. `pnpm install --frozen-lockfile`
       5. `pnpm build:backend`
       6. `pnpm smoke` (or `pnpm test` if smoke is sufficient)
       7. Run migrations: `pnpm --filter @my-ai-orchestrator/backend migrate`
       8. Reload: `pm2 reload ecosystem.config.cjs --only cultiv-api` (zero-downtime)
       9. Restart: `pm2 restart ecosystem.config.cjs --only cultiv-worker`
       10. Health: `sleep 5 && curl -f http://127.0.0.1:3001/health || exit 1`
       11. Cleanup: `pm2 flush --older-than 7d`
       12. Notify: Discord webhook on success/failure

   **Alternative (if self-hosted runner is problematic):**
   - Use a webhook approach: GitHub Actions sends webhook to VM, VM executes deploy script.
   - Or: GitHub Actions builds artifact, uploads to Object Storage, VM polls for new artifact.
   - Or: Cloudflare Access for SSH (GitHub Actions uses `cloudflared access` to SSH via tunnel).

5. **GitHub Secrets required**
   - `DISCORD_WEBHOOK_URL`: URL for deploy notifications
   - No SSH secrets needed (runner is on the VM)

6. **Rollback strategy**
   - On deploy failure: health check fails, workflow exits with error
   - PM2 keeps previous version running (reload is atomic; if new version fails, old process stays)
   - For severe failures: access VM via Cloudflare Zero Trust SSH, run `pm2 reload all`, or run `scripts/emergency-restart.sh`
   - Manual rollback: restore previous `dist/` directory from backup
   - Emergency: Integrator hPanel VNC/serial console (password-based, slow but works)

## Acceptance criteria

- [ ] `ecosystem.config.cjs` created and tested on VM.
- [ ] `.env` configured with all required secrets (documented in password manager).
- [ ] Migrations run successfully against PostgreSQL.
- [ ] API and Worker start via PM2 and respond to health check.
- [ ] `curl https://api.cultiv.app/health` returns 200 from local machine.
- [ ] Smoke test: enqueue a job, verify worker completes it.
- [ ] GitHub Actions workflow file exists and runs on push.
- [ ] Deploy from `main` to VM succeeds end-to-end.
- [ ] Discord notification received on deploy success.
- [ ] Deploy failure (simulated) triggers Discord alert and does not break running service.

## Blocked by

- Issue 60 (VM must be bootstrapped with Docker, Node.js, PM2, Nginx)
- Issue 59 (Cloudflare Tunnel must be active so external health check works)
- GitHub repository with Actions enabled (already exists)

## Notes

- The first deploy is manual to establish baseline. Subsequent deploys are automated.
- `pm2 reload` is zero-downtime for the API. Worker restart is acceptable (jobs are durable in PG).
- `pnpm install --prod` installs only production dependencies (faster, smaller).
- Keep `.env` out of the artifact. It lives on the VM only.
- The workflow can be tested by pushing a trivial change (e.g., comment) to `main`.
