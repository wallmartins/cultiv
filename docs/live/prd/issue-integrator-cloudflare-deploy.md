---
title: Integrator VPS + Cloudflare R2 + Cloudflare Tunnel Deploy
status: ready-for-agent
domain: backend-platform
slice_type: HITL
last_updated: 2026-06-15
---

# Integrator VPS + Cloudflare R2 + Cloudflare Tunnel Deploy

## Parent

- PRD: [`integrator-cloudflare-deploy.md`](./integrator-cloudflare-deploy.md)
- ADR: [`0005-integrator-cloudflare-deploy.md`](../../adr/0005-integrator-cloudflare-deploy.md)
- Plan: [`../plan/integrator-cloudflare-deploy-implementation-plan.md`](../plan/integrator-cloudflare-deploy-implementation-plan.md)
- Domain: [`CONTEXT.md`](../../../CONTEXT.md)

## What to build

Deploy the Cultiv backend on an **Integrator VPS** (VPS Linux Core, Brazil datacenter) with **Cloudflare R2** for backup storage and **Cloudflare** as edge proxy (WAF, SSL, Tunnel). The frontend stays on **Vercel**. Total infrastructure cost: **~R$ 40/month**.

This parent tracks:
- Integrator VPS provisioning and home region decision
- Cloudflare Tunnel and WAF configuration
- VM bootstrap (Docker, Node.js, PM2, Nginx, cloudflared, rclone)
- Self-hosted PostgreSQL + Redis via Docker
- GitHub Actions CI/CD pipeline
- Health monitoring, alerting, and auto-recovery
- Backup to Cloudflare R2 and disaster recovery
- Graceful shutdown implementation
- End-to-end verification and go-live checklist

## Child issues

| # | Issue | Type | Blocked by |
|---|-------|------|------------|
| 58 | [VPS provisioning and home region](../issues/58-oracle-vm-provisioning.md) | AFK | — |
| 59 | [Cloudflare Tunnel and WAF setup](../issues/59-cloudflare-tunnel-waf.md) | AFK | — |
| 60 | [VM bootstrap and Docker Compose](../issues/60-vm-bootstrap-docker.md) | AFK | 58 |
| 61 | [Backend deployment pipeline](../issues/61-backend-deployment-pipeline.md) | AFK | 60 |
| 62 | [Monitoring and alerting](../issues/62-monitoring-alerting.md) | AFK | 61 |
| 63 | [Backup and disaster recovery](../issues/63-backup-recovery.md) | AFK | 60 |
| 64 | [Graceful shutdown implementation](../issues/64-graceful-shutdown.md) | AFK | 61 |
| 65 | [Deploy verification and go-live](../issues/65-oracle-deploy-verification.md) | HITL | 62, 63, 64 |

**Suggested order:** 58 → 59 → 60 → 61 → 62 → 63 → 64 → 65

## Acceptance criteria (program)

- [ ] Backend deployed on Integrator VPS, accessible via `https://api.cultiv.app` (or configured subdomain).
- [ ] `POST /me/executions/run` returns `202` and job completes successfully through worker.
- [ ] Outbox relay publishes events; worker consumes from BullMQ; SSE delivers progress.
- [ ] Health check script runs every 2 minutes and auto-recovers from failures.
- [ ] Discord alerts on failure (health check, backup, deploy, uptime).
- [ ] Daily backup to Cloudflare R2 succeeds.
- [ ] Deploy pipeline: push to `main` → build → test → deploy → health check → notification.
- [ ] Issue 65 operator checklist signed off.

## Blocked by

- None for issue 58 — provisioning is independent.
- Cloudflare account and DNS zone must be configured before issue 59.
- Integrator account must be created and VPS provisioned before issue 58.
- Auth0 callback URL must be updated to Cloudflare endpoint before go-live.
