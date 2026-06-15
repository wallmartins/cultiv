---
title: Integrator VPS + Cloudflare R2 + Cloudflare Tunnel Deploy
doc_type: prd
status: ready-for-agent
domain: backend-platform
last_updated: 2026-06-15
---

# Integrator VPS + Cloudflare R2 + Cloudflare Tunnel Deploy — PRD

## Summary

Deploy the Cultiv backend on an **Integrator VPS** (VPS Linux Core, Brazil datacenter) with **Cloudflare R2** for backup storage and **Cloudflare** as edge proxy. Frontend remains on **Vercel**. Target: **~R$ 40/month infrastructure cost**, low-latency for Brazilian users, production-grade security, monitoring, and disaster recovery.

**Governance:** [ADR 0005](../../adr/0005-integrator-cloudflare-deploy.md) · plan · [parent issue](./issue-integrator-cloudflare-deploy.md) · [issues 58–65](../issues/README.md#integrator-cloudflare-deploy)

## Problem

Railway's $5/month plan is the current deployment target but represents a recurring cost and requires an international credit card (which is blocked). The Integrator VPS offers 4 vCPUs @ AMD EPYC 2.6GHz, 6GB RAM, 100GB NVMe, 30TB egress, and accepts Pix/Boleto — for R$ 39.90/month. Combined with Cloudflare's free WAF, SSL, Tunnel, and R2's 10GB free backup storage, we get low-latency Brazilian infrastructure without payment friction.

## Goals

1. **Low infrastructure cost** — ~R$ 40/month for VM, database, cache, backup storage, CDN, and WAF.
2. **Low latency for Brazilian users** — < 5ms RTT from Brazil datacenter.
3. **Production-grade security** — no exposed VM ports, SSL termination at edge, DDoS protection, bot management.
4. **Operational visibility** — automated health checks, alerting, metrics, backups, and log rotation.
5. **Global accessibility** — accessible from day 1 via Cloudflare's global edge network.
6. **Graceful shutdown** — SIGTERM/SIGINT handlers to close connections cleanly on deploy or restart.
7. **Automated CI/CD** — push to `main` triggers build, test, deploy, and health verification.

## Non-goals

- Multi-region active-active deployment (single VM for MVP; geo-routing is a future scale decision).
- Kubernetes or container orchestration (overkill for a single VM).
- External log aggregation (Datadog, Splunk) — PM2 + logrotate is sufficient.
- Prometheus/Grafana metrics stack — lightweight JSON metrics endpoint is sufficient.
- Managed PostgreSQL or Redis (Integrator does not offer managed databases in this tier).

## Users and stakeholders

| Actor | Need |
|-------|------|
| End user | API is always available, low latency, secure |
| Operator | Knows when something breaks, can recover quickly |
| Developer | Deploys with `git push`, no manual SSH for routine updates |
| Finance | ~R$ 40/month predictable burn |

## Product behavior (locked)

### Deployment

1. Developer pushes to `main`.
2. GitHub Actions builds, tests, and deploys to Integrator VPS.
3. Migrations run automatically before service restart.
4. Health check confirms deploy success.
5. Discord notification confirms deploy or alerts on failure.

### Failure modes (operator-visible)

| Situation | Expected behavior |
|-----------|-------------------|
| API process crashes | PM2 auto-restarts; health check alerts if restart loop |
| Worker process crashes | PM2 auto-restarts; stuck jobs detected by health check |
| PostgreSQL container stops | Docker auto-restarts; health check alerts |
| Redis container stops | Docker auto-restarts; outbox relay catches up when Redis returns |
| VM restart (Integrator maintenance) | PM2 auto-starts via systemd; cloudflared auto-starts |
| Disk > 80% | Health check alerts; logrotate + backup cleanup reduce usage |
| Memory > 90% | Health check alerts; PM2 may restart leaky process |
| Outbox > 100 unpublished | Health check alerts; relay may be stuck |
| Jobs stuck > 30 min | Health check alerts; operator investigates |

### Backup

1. Daily at 03:00 UTC: `pg_dump` + `gzip` → local disk → Cloudflare R2.
2. Daily at 03:00 UTC: Redis `BGSAVE` → local disk → Cloudflare R2.
3. Retention: 7 days local, 30 days in R2.
4. Backup failure triggers Discord alert.
5. R2 is S3-compatible; accessed via `rclone` with Cloudflare account credentials.

## Technical requirements

### Infrastructure

- Integrator VPS (VPS Linux Core, 4 vCPUs @ AMD EPYC 2.6GHz + 6GB RAM + 100GB NVMe, Brazil datacenter).
- Ubuntu 26.04 LTS.
- Docker (engine + compose plugin) for PostgreSQL and Redis.
- Node.js 22 + pnpm 11.3 + PM2.
- Nginx (reverse proxy, HTTP only, localhost bind).
- cloudflared (Cloudflare Tunnel daemon).
- rclone (for Cloudflare R2 backup upload).
- UFW + logrotate + unattended-upgrades. No fail2ban (SSH not exposed).

### Networking

- Cloudflare Tunnel: outbound from VM to Cloudflare edge. No inbound port exposure.
- Nginx listens on `127.0.0.1:80` only.
- Backend API listens on `127.0.0.1:3001` only.
- PostgreSQL listens on `127.0.0.1:5432` only (Docker bind).
- Redis listens on `127.0.0.1:6379` only (Docker bind).
- SSH: **not exposed to internet**. Access via Cloudflare Zero Trust (browser-based SSH or `cloudflared access`).

### Application

- `main.ts`: Hono HTTP server + outbox relay (polling, default 1s interval).
- `worker-main.ts`: BullMQ consumer + pipeline execution.
- Graceful shutdown: SIGTERM/SIGINT handlers to close queue, stop relay, release DB pool.
- `TRUST_PROXY=true` so backend reads `CF-Connecting-IP` for rate limiting.
- `CORS_ALLOWED_ORIGINS` includes Vercel frontend domains.

### Monitoring

- Health check script (cron every 2 minutes): `/health`, `/ready`, worker status, DB, Redis, disk, memory, outbox, stuck jobs.
- Auto-recovery: restart process/container if unresponsive.
- Alert: Discord webhook on failure.
- UptimeRobot: external ping every 5 minutes.
- Metrics collector (cron every 1 minute): CPU, RAM, disk, DB size, job counts, outbox size, Redis keys. JSON served at `/metrics`.
- Log summary (daily 08:00): error/warning count summary to Discord.

### CI/CD

- GitHub Actions workflow:
  - Build: `pnpm install --frozen-lockfile && pnpm build:backend`
  - Test: `pnpm smoke`
  - Artifact: `tar.gz` of `dist/`, `policies/`, `package.json`, lockfile
  - Deploy: `scp` artifact to VM, `ssh` to extract, install, migrate, PM2 reload
  - Health check: `curl` VM localhost `/health`
  - Notification: Discord webhook on success/failure

## Success metrics

| Metric | Target |
|--------|--------|
| Uptime | > 99.5% (UptimeRobot monthly) |
| Deploy time | < 5 minutes from push to health OK |
| Alert latency | < 5 minutes from failure to Discord notification |
| Backup success | 100% (daily, no missed days) |
| Recovery time (RTO) | < 2 hours for manual restore from backup |
| Cost | ~R$ 40/month |
| Latency (BR) | < 5ms average RTT |

## Dependencies

- ADR 0004 (Durable Async Runtime) — backend must be stateless and outbox-ready.
- Cloudflare account with DNS zone for `cultiv.app`.
- Integrator account with VPS Linux Core.
- GitHub repository with Actions enabled.
- Auth0 tenant with callback URL configured for Cloudflare endpoint.
- Discord server with webhook URL.

## Out of scope / follow-ups

- Multi-region deployment (scale phase).
- Kubernetes or container orchestration.
- Paid monitoring (Datadog, New Relic).
- Integrator Load Balancer (not applicable to single VM).
- Database read replicas or partitioning.
- Redis Cluster or Sentinel.

## Related

- ADR: [`0005-integrator-cloudflare-deploy.md`](../../adr/0005-integrator-cloudflare-deploy.md)
- Plan: [`integrator-cloudflare-deploy-implementation-plan.md`](../plan/integrator-cloudflare-deploy-implementation-plan.md)
- Parent Issue: [`issue-integrator-cloudflare-deploy.md`](./issue-integrator-cloudflare-deploy.md)
