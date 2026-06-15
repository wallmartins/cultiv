---
title: Integrator VPS + Cloudflare R2 + Cloudflare Tunnel — Production Deploy
status: accepted
last_updated: 2026-06-15
---

# Integrator VPS + Cloudflare R2 + Cloudflare Tunnel — Production Deploy

We decided to deploy the Cultiv backend on an **Integrator VPS** (VPS Linux Core, Brazil datacenter) with **Cloudflare R2** for backup storage and **Cloudflare** as edge proxy (WAF, SSL, DDoS, Tunnel). The frontend remains on **Vercel** (free tier). The goal is **low-cost, low-latency production infrastructure** for the Brazilian market while maintaining global reach, security, and operational readiness.

## Problem

Railway's $5/month Hobby tier is the default deployment target, but the free tier cannot accommodate the project (requires PostgreSQL + Redis + API + Worker). The $5/month plan is operationally simple but represents a recurring cost. Additionally, we need a deployment path that is:

- **Payment-accessible** for a Brazilian operator (accepts Pix, Boleto, or local debit card — no international credit card required)
- **Low-latency for Brazilian users** (target audience is pt-BR first, then global)
- **Secure by default** (no exposed VM ports, DDoS protection, SSL)
- **Operationally viable** (monitoring, alerting, backups, auto-recovery)
- **Compatible with existing architecture** (PostgreSQL + Redis + BullMQ + Node.js + Hono)
- **Globally accessible** from day 1 via Cloudflare edge

## Considered Options

1. **Railway $5 Hobby** — Rejected for cost and payment method (requires international credit card, which is blocked).
2. **Railway + managed add-ons (PG + Redis)** — Rejected. Same cost and payment issues.
3. **Vercel (serverless) for backend** — Rejected. The backend requires long-running workers (BullMQ), persistent PostgreSQL connections, and outbox relay polling. Serverless is incompatible.
4. **Oracle Cloud Always Free** — Rejected. Requires international credit card verification, which is blocked. Even though it would be $0, it's not accessible.
5. **Hetzner Cloud (€3.29-5.99/mês, Frankfurt)** — Rejected for **payment method**. The operator's international credit card is blocked, and Hetzner only accepts credit card or SEPA (European bank transfer). Even though cost-effective, it's not accessible.
6. **Contabo VPS (€5.50/mês)** — Rejected for **payment method**. Same credit card/SEPA requirement as Hetzner. Not accessible.
7. **Hostinger Brasil VPS (KVM 1, R$ 52.99/mês)** — Rejected for **cost/specs**. 1 vCPU, 4GB RAM, 50GB NVMe for R$ 52.99 is overpriced compared to alternatives.
8. **Cloud Prime VPS NVMe 4 (R$ 69.90/mês)** — Rejected for **cost**. 2 vCPUs, 4GB RAM, 50GB SSD. Good specs but 75% more expensive than Integrator.
9. **Integrator VPS Linux Core (R$ 39.90/mês)** — **Accepted**. 4 vCPUs @ AMD EPYC 2.6GHz, 6GB RAM, 100GB NVMe, 30TB egress, 99.99% uptime, 1Gbps link. Best cost-benefit ratio. Accepts Pix/Boleto.

## Architecture

```
Internet → Cloudflare Edge (WAF, SSL, DDoS)
    → Cloudflare Tunnel (cloudflared outbound)
         → Integrator VPS (Brazil, Ubuntu 26.04 LTS)
            ├── Nginx (127.0.0.1:80, reverse proxy)
            ├── PM2: API (port 3001, outbox relay included)
            ├── PM2: Worker (BullMQ consumer)
            ├── Docker: PostgreSQL 16 (port 5432, local bind)
            └── Docker: Redis 7 (port 6379, local bind, AOF)

Backup → Cloudflare R2 (S3-compatible, 10GB free tier)
```

### Key architectural decisions

| Concern | Decision | Rationale |
|---------|--------|-----------|
| **VM provider** | Integrator (VPS Linux Core) | 4 vCPUs @ AMD EPYC, 6GB RAM, 100GB NVMe, 30TB egress, R$ 39.90/mês. Best cost-benefit ratio for Brazilian operators |
| **VM shape** | 4 vCPUs + 6GB RAM + 100GB NVMe | Abundant for Node.js + PostgreSQL + Redis + 2 processes. Room for growth without upgrade |
| **Region** | Brazil (Integrator DC) | Primary audience is Brazilian; < 5ms latency |
| **SSL** | Cloudflare terminates | No Certbot needed on VM. Nginx receives HTTP only |
| **Inbound exposure** | Zero ports | Cloudflare Tunnel is outbound-only. SSH is not exposed to internet (Cloudflare Zero Trust) |
| **Database** | PostgreSQL 16 self-hosted (Docker) | Integrator does not offer managed PostgreSQL. Docker bind mount for persistence |
| **Cache/Queue** | Redis 7 self-hosted (Docker, AOF) | Integrator does not offer managed Redis. AOF ensures durability on restart |
| **Process manager** | PM2 (2 processes) | API + Worker. Outbox relay runs inside API process (no extra process needed) |
| **Graceful shutdown** | SIGTERM/SIGINT handlers | Implemented in `main.ts` and `worker-main.ts`. Closes queue, stops relay, releases DB pool |
| **Logging** | Console → PM2 → logrotate | No external log aggregator (free). 14-day retention |
| **Metrics** | Script JSON + Nginx endpoint | Lightweight. No Prometheus/Grafana (overkill for MVP) |
| **Alerting** | Discord webhook + UptimeRobot | Free. Health check script every 2 minutes |
| **Backup** | pg_dump + Redis BGSAVE → Cloudflare R2 | Daily cron. 7-day local retention. R2 has 10GB free tier, S3-compatible, zero egress cost |
| **CI/CD** | GitHub Actions → SCP + SSH → PM2 reload | No Docker registry needed. Build on GitHub, deploy artifact to VM |
| **Frontend** | Vercel (unchanged) | Marketing + app shell. API calls go to Cloudflare Tunnel endpoint |

## Outbox Pattern Compatibility

The existing transactional outbox (`outbox_events` table + relay + `FOR UPDATE SKIP LOCKED`) is fully compatible with self-hosted PostgreSQL + Redis. The relay already runs inside the API process. No architectural changes required.

## Security Model

| Layer | Control |
|-------|---------|
| Cloudflare | WAF rules, DDoS, bot management, rate limiting |
| Cloudflare Tunnel | Outbound-only connection, no public IP exposure |
| Cloudflare Zero Trust | SSH access via browser (no exposed SSH port, 2FA, identity) |
| Integrator Firewall | **Zero inbound ports** (no SSH, no HTTP, no HTTPS) — configured via UFW |
| UFW (host) | Deny incoming, allow outgoing only |
| Nginx | Listen only on 127.0.0.1, proxy to backend |
| PostgreSQL | Bind 127.0.0.1, no auth from network |
| Redis | Bind 127.0.0.1, optional `requirepass` |
| Backend | `TRUST_PROXY=true` reads `CF-Connecting-IP` for rate limiting |

## Global Reach from Day 1

| Component | Global Strategy |
|-----------|----------------|
| Frontend (Vercel) | Edge CDN worldwide |
| API (Integrator BR) | Single origin, ~5ms to Brazil, ~150ms to EUA, ~200ms to Europa. Acceptable for async workflows |
| SSE (Execution Watch) | Same latency as API. Connection is persistent, so handshake cost is one-time |
| Future scaling | When global traffic justifies, add second VM in Europe/USA. Cloudflare Load Balancing (paid) routes by geo |

## Backup Strategy with Cloudflare R2

| Aspect | R2 Configuration |
|--------|-----------------|
| **Storage** | ~500MB/day backup × 30 days = ~15GB. R2 free: 10GB. **Cost: ~$0.05-0.15/month** |
| **Egress** | **$0** (free egress) — critical for disaster recovery |
| **Tool** | `rclone` configured with S3-compatible endpoint (`https://<account>.r2.cloudflarestorage.com`) |
| **Retention** | 7 days local, 30 days in R2 |
| **Encryption** | R2 encrypts at rest by default |

## Consequences

### Operational
- **Setup time:** 4-6 hours (one-time)
- **Monthly maintenance:** 10-15 minutes (automated health checks, backups, log rotation)
- **Monthly cost:** R$ 39.90 (Integrator VPS Linux Core) + ~$0.10 (R2 overage if > 10GB) + $0 (Cloudflare/Vercel) = **~R$ 40/month**
- **Manual intervention required for:** VM restart, Integrator maintenance windows, Cloudflare Tunnel re-authentication

### Technical
- **Graceful shutdown:** Already implemented in `main.ts` and `worker-main.ts`
- **Backup responsibility:** You are the DBA. Recovery RPO = 24 hours (daily backup), RTO = 1-2 hours (manual restore)
- **Scaling ceiling:** Single VM. 6GB RAM and 4 vCPUs provide headroom for growth. When limits are hit, upgrade to a larger Integrator plan or add a second VM
- **No managed DB:** PostgreSQL tuning, vacuum, indexing, and connection monitoring are your responsibility

### Cost
- **Integrator VPS:** R$ 39.90/month (VPS Linux Core, monthly plan — no contract)
- **Cloudflare R2:** ~$0-0.15/month (within 10GB free tier or minimal overage)
- **Cloudflare:** $0 (Free plan: DNS, Tunnel, WAF, SSL)
- **Vercel:** $0 (Free tier: frontend hosting)
- **UptimeRobot:** $0 (Free tier: 50 monitors)
- **Discord:** $0 (Webhook notifications)
- **Total:** ~R$ 40/month (~$7 USD)

## Dependencies

- ADR 0004 (Durable Async Runtime) — the backend must be outbox-ready and stateless
- Cloudflare account (free plan) with DNS zone for `cultiv.app` (or subdomain)
- Integrator account with VPS Linux Core provisioned
- GitHub repository (already exists) with Actions enabled
- Auth0 tenant (already configured) — callback URL must be updated to Cloudflare endpoint

## Follow-up decisions

- When to add a second VM in another region (scale decision)
- When to upgrade to a larger Integrator plan (if traffic grows)
- Whether to add Cloudflare Load Balancing (paid) for multi-VM geo-routing

## Related

- PRD: [`integrator-cloudflare-deploy.md`](../live/prd/integrator-cloudflare-deploy.md)
- Plan: [`integrator-cloudflare-deploy-implementation-plan.md`](../live/plan/integrator-cloudflare-deploy-implementation-plan.md)
- Parent Issue: [`issue-integrator-cloudflare-deploy.md`](../live/prd/issue-integrator-cloudflare-deploy.md)
- Issues: [`docs/live/issues/README.md`](../live/issues/README.md#integrator-cloudflare-deploy)
