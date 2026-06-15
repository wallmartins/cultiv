---
title: Integrator VPS + Cloudflare R2 + Cloudflare Tunnel — Implementation Plan
doc_type: plan
status: draft
last_updated: 2026-06-15
---

# Integrator VPS + Cloudflare R2 + Cloudflare Tunnel — Implementation Plan

## Objective

Deploy the Cultiv backend on an Integrator VPS (VPS Linux Core, Brazil) with Cloudflare R2 for backup storage and Cloudflare as edge proxy, achieving ~R$ 40/month infrastructure cost with low latency for Brazilian users while maintaining production-grade security, monitoring, and disaster recovery.

## Governance

- **PRD:** [`integrator-cloudflare-deploy.md`](../prd/integrator-cloudflare-deploy.md)
- **ADR:** [`0005-integrator-cloudflare-deploy.md`](../../adr/0005-integrator-cloudflare-deploy.md)
- **Parent Issue:** [`issue-integrator-cloudflare-deploy.md`](../prd/issue-integrator-cloudflare-deploy.md)
- **Issues:** [`issues/README.md`](../issues/README.md#integrator-cloudflare-deploy)

## Timeline

| Day | Issues | Focus | Hours |
|-----|--------|-------|-------|
| 1 | 58 | VPS provisioning, Integrator account, region decision | 2-3 |
| 1 | 59 | Cloudflare Tunnel, DNS, WAF, R2 bucket setup | 2-3 |
| 2 | 60 | VPS bootstrap, Docker Compose, Nginx, cloudflared, rclone | 4-6 |
| 3 | 61 | First deploy, PM2, `.env`, GitHub Actions CI/CD | 4-6 |
| 4 | 62 | Monitoring scripts, alerting, UptimeRobot | 3-4 |
| 4 | 63 | Backup script, R2 upload, verification | 2-3 |
| 5 | 64 | Graceful shutdown (code change) | 2-3 |
| 5 | 65 | End-to-end verification, go-live checklist | 3-4 |
| **Total** | 58-65 | | **17-25 hours** |

## Architecture

```
Internet → Cloudflare Edge (WAF, SSL, DDoS)
    → Cloudflare Tunnel (cloudflared outbound)
        → Integrator VPS (Brazil, Ubuntu 26.04 LTS)
            ├── Nginx (127.0.0.1:80)
            ├── PM2: API (port 3001, outbox relay included)
            ├── PM2: Worker (BullMQ consumer)
            ├── Docker: PostgreSQL 16 (port 5432, local bind)
            └── Docker: Redis 7 (port 6379, local bind, AOF)

Backup → Cloudflare R2 (S3-compatible, 10GB free tier)
```

## Key Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| VM provider | Integrator VPS Linux Core | 4 vCPUs @ AMD EPYC, 6GB RAM, 100GB NVMe, 30TB egress, R$ 39.90/mês. Best cost-benefit |
| VM shape | 4 vCPUs + 6GB RAM + 100GB NVMe | Abundant for Node.js + PostgreSQL + Redis + 2 processes. Room for growth |
| Region | Brazil (primary) | pt-BR default audience, < 5ms latency |
| SSL | Cloudflare terminates | No Certbot needed |
| Inbound exposure | Zero ports | Cloudflare Tunnel + Zero Trust SSH (no exposed SSH) |
| Database | PostgreSQL 16 self-hosted (Docker) | Integrator managed PG not available |
| Cache/Queue | Redis 7 self-hosted (Docker, AOF) | Integrator managed Redis not available |
| Process manager | PM2 (2 processes) | API + Worker, relay in API |
| Graceful shutdown | SIGTERM/SIGINT handlers | Code change required |
| Logging | Console → PM2 → logrotate | No external aggregator |
| Metrics | JSON file + Nginx endpoint | Lightweight, no Prometheus |
| Alerting | Discord webhook + UptimeRobot | Free |
| Backup | pg_dump + Redis BGSAVE → Cloudflare R2 | Daily, 7/30 day retention. R2: 10GB free, zero egress cost |
| Backup tool | rclone | S3-compatible, simple CLI, works with R2 |
| CI/CD | GitHub Actions self-hosted runner | No SSH exposure, runner on VM |
| Frontend | Vercel (unchanged) | Marketing + app shell |

## Files to Create

| File | Path | Issue |
|------|------|-------|
| `bootstrap-vm.sh` | `scripts/bootstrap-vm.sh` | 60 |
| `docker-compose.yml` | `docker-compose.yml` | 60 |
| `nginx.conf` | `nginx.conf` | 60 |
| `ecosystem.config.cjs` | `ecosystem.config.cjs` | 61 |
| `health-check.sh` | `scripts/health-check.sh` | 62 |
| `metrics-collector.sh` | `scripts/metrics-collector.sh` | 62 |
| `log-summary.sh` | `scripts/log-summary.sh` | 62 |
| `backup.sh` | `scripts/backup.sh` | 63 |
| `verify-backup.sh` | `scripts/verify-backup.sh` | 63 |
| `emergency-restart.sh` | `scripts/emergency-restart.sh` | 65 |
| `diagnose.sh` | `scripts/diagnose.sh` | 65 |
| `go-live-check.sh` | `scripts/go-live-check.sh` | 65 |
| `verify-cloudflare.sh` | `scripts/verify-cloudflare.sh` | 59 |
| `deploy-integrator.yml` | `.github/workflows/deploy-integrator.yml` | 61 |
| `integrator-vps-provisioning.md` | `docs/runbooks/integrator-vps-provisioning.md` | 58 |
| `cloudflare-tunnel-setup.md` | `docs/runbooks/cloudflare-tunnel-setup.md` | 59 |
| `cloudflare-r2-setup.md` | `docs/runbooks/cloudflare-r2-setup.md` | 59 |
| `monitoring-alerting.md` | `docs/runbooks/monitoring-alerting.md` | 62 |
| `disaster-recovery.md` | `docs/runbooks/disaster-recovery.md` | 63 |
| `graceful-shutdown.md` | `docs/runbooks/graceful-shutdown.md` | 64 |
| `integrator-deploy-go-live.md` | `docs/runbooks/integrator-deploy-go-live.md` | 65 |

## Code Changes

| File | Change | Issue |
|------|--------|-------|
| `apps/backend/src/cli/main.ts` | Add SIGTERM/SIGINT handler, graceful shutdown sequence | 64 |
| `apps/backend/src/cli/worker-main.ts` | Add SIGTERM/SIGINT handler, worker close | 64 |

## Environment Variables

| Variable | Required | Notes |
|----------|----------|-------|
| `DATABASE_URL` | Yes | PostgreSQL connection string |
| `REDIS_URL` | Yes | Redis connection string |
| `AUTH_ISSUER_URL` | Yes | Auth0 tenant |
| `AUTH_AUDIENCE` | Yes | Auth0 API identifier |
| `AUTH_JWKS_URL` | Yes | Auth0 JWKS endpoint |
| `OPENAI_API_KEY` | Yes | Provider API key |
| `ANTHROPIC_API_KEY` | Yes | Provider API key |
| `GEMINI_API_KEY` | Yes | Provider API key |
| `DEEPSEEK_API_KEY` | Yes | Provider API key |
| `VOICE_DATA_PROTECTION_KEY` | Yes | 32+ chars |
| `CORS_ALLOWED_ORIGINS` | Yes | Vercel domains |
| `BACKEND_TRUST_PROXY` | Yes | `true` for Cloudflare |
| `OUTBOX_RELAY_INTERVAL_MS` | Recommended | Default 1000ms |
| `DISCORD_WEBHOOK_URL` | Recommended | Alert notifications |
| `R2_BUCKET_NAME` | Yes | Cloudflare R2 bucket for backups |
| `R2_ENDPOINT` | Yes | `https://<account>.r2.cloudflarestorage.com` |
| `R2_ACCESS_KEY_ID` | Yes | Cloudflare R2 API token key |
| `R2_SECRET_ACCESS_KEY` | Yes | Cloudflare R2 API token secret |
| `BILLING_USER_ID` | Optional | For billing seed |
| `BILLING_PLAN_ID` | Optional | For billing seed |

## Dependencies

- Integrator account (VPS Linux Core in Brazil)
- Cloudflare account (free plan, DNS zone for `cultiv.app`)
- Cloudflare R2 bucket (created in Cloudflare dashboard)
- rclone configured with R2 credentials
- GitHub repository (Actions enabled)
- Auth0 tenant (callback URL updated)
- Discord server (webhook URL)
- UptimeRobot account (free plan)
- Cloudflare Zero Trust (50 users free tier)

## Risks

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| Integrator VPS maintenance/restart | Medium | Medium | PM2 auto-start, systemd, cloudflared auto-start |
| R2 10GB free tier exceeded | Low | Medium | Monitor size; cost is minimal (~$0.015/GB) |
| rclone misconfigured | Low | High | Test backup manually after setup; verify script |
| Backup fails silently | Medium | High | Verification script, Discord alert, weekly restore test |
| Graceful shutdown bug | Low | Medium | Test thoroughly, PM2 kill_timeout |
| Cloudflare Tunnel outage | Low | High | UptimeRobot alert, Integrator console emergency access |
| Zero Trust SSH unavailable | Low | Medium | Integrator console as emergency access |
| Disk fills up | Low | Medium | Logrotate, backup cleanup, health check |
| Payment issue (Pix delay) | Low | Medium | Integrator gives grace period; VPS stays up for days |

## Success Criteria

- Backend deployed and accessible via `https://api.cultiv.app`
- End-to-end job enqueue completes successfully
- Health check auto-recovers from failures
- Discord alerts on failure
- Daily backup to Cloudflare R2 succeeds
- Deploy pipeline: push → build → deploy → health check → notification
- ~R$ 40/month predictable cost
- < 5ms average latency from Brazil

## Follow-ups

- Multi-region deployment (second VM in Europe/USA)
- Integrator plan upgrade (if 6GB RAM insufficient)
- Cloudflare Load Balancing (paid) for geo-routing
- Kubernetes migration (if scaling beyond single VM)
- Prometheus/Grafana (if metrics needs grow)
- External log aggregation (if log volume grows)
