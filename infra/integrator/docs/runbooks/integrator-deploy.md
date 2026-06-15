# Cultiv — Integrator VPS Deploy Runbook

## Overview

This runbook describes the complete Integrator VPS deployment for the Cultiv backend.

## Architecture

```
Internet
  └── Cloudflare Edge (WAF, SSL, DDoS)
      ├── api.cultiv.app (Tunnel → API)
      └── ssh.cultiv.app (Zero Trust → SSH)

Integrator VPS (Brazil, VPS Linux Core)
  ├── Nginx (127.0.0.1:80)
  ├── PM2: API (port 3001)
  ├── PM2: Worker (BullMQ)
  ├── Docker: PostgreSQL 16 (5432)
  └── Docker: Redis 7 (6379)
```

## Directory Structure

```
/home/ubuntu/cultiv/
├── app/                    # Application code
│   ├── apps/backend/
│   ├── packages/
│   └── ecosystem.config.cjs
├── data/
│   ├── postgres/           # PostgreSQL volume
│   ├── redis/              # Redis volume
│   └── backups/            # Local backups
├── logs/                   # Application logs
├── metrics/                # Metrics JSON
├── scripts/                # Automation scripts
│   ├── bootstrap-vm.sh
│   ├── health-check.sh
│   ├── metrics-collector.sh
│   ├── backup.sh
│   ├── verify-backup.sh
│   ├── log-summary.sh
│   ├── emergency-restart.sh
│   ├── diagnose.sh
│   └── go-live-check.sh
└── docker-compose.yml
```

## Quick Commands

| Command | Description |
|---------|-------------|
| `status` | PM2 + Docker status |
| `logs-api` | API logs |
| `logs-worker` | Worker logs |
| `logs-err` | Error logs |
| `metrics` | Metrics JSON |
| `diagnose` | Full diagnostic |
| `emergency` | Emergency restart |

## Deployment

### Manual Deploy

```bash
cd /home/ubuntu/cultiv/app
pnpm install --frozen-lockfile
pnpm build:backend
pnpm --filter @my-ai-orchestrator/backend migrate
pm2 reload ecosystem.config.cjs --only cultiv-api
pm2 restart ecosystem.config.cjs --only cultiv-worker
```

### Automated Deploy (GitHub Actions)

Push to `main` → GitHub Actions self-hosted runner → Build → Deploy → Health check

## Monitoring

- Health check: every 2 minutes
- Metrics: every 1 minute
- Backup: daily at 03:00 UTC
- Log summary: daily at 08:00 UTC

## Security

- Zero inbound ports
- SSH via Cloudflare Zero Trust (not exposed)
- Cloudflare WAF (DDoS, bots, rate limiting)
- SSL termination at edge
- PostgreSQL/Redis bind local only

## Backup

- Daily: `pg_dump` + Redis `BGSAVE`
- Upload: Cloudflare R2 (S3-compatible, 10GB free tier)
- Retention: 7 days local, 30 days in R2
- Verification: weekly (restore test)
- Tool: `rclone` configured with R2 credentials

## Disaster Recovery

See `disaster-recovery.md` for:
- Database corruption
- VPS total loss
- Accidental deletion
- Redis data loss

## Troubleshooting

### API not responding
```bash
pm2 logs cultiv-api
pm2 status
```

### Database issues
```bash
docker logs cultiv-postgres
docker exec cultiv-postgres psql -U cultiv -c "SELECT * FROM pg_stat_activity;"
```

### Redis issues
```bash
docker logs cultiv-redis
docker exec cultiv-redis redis-cli info
```

### Deploy failed
```bash
# Check logs
pm2 logs
# Restart
pm2 restart all
# Emergency
./scripts/emergency-restart.sh
```

## Cost

- **Integrator VPS:** R$ 39.90/month (VPS Linux Core, monthly plan — no contract)
- **Cloudflare:** $0 (Free plan)
- **Cloudflare R2:** ~$0-0.15/month (within 10GB free tier)
- **Vercel:** $0 (Free tier)

## Support

- Issues: [docs/live/issues/58-65](../../docs/live/issues/README.md)
- ADR: [0005](../../docs/adr/0005-integrator-cloudflare-deploy.md)
- PRD: [integrator-cloudflare-deploy](../../docs/live/prd/integrator-cloudflare-deploy.md)
