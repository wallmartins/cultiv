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
/home/cultiv/cultiv/
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

### Manual deploy (git pull on VPS)

`git pull` updates **source only**. The worker runs the bundled file `apps/backend/dist/cli/worker-main.js`, so you must rebuild after every pull:

```bash
cd /home/cultiv/app   # or /home/cultiv/cultiv/app depending on your layout
git pull
bash infra/integrator/scripts/manual-build-deploy.sh
```

The script forces a full dependency install (`NODE_ENV=development` + `--prod=false`) so `esbuild` is available even when `.env` sets `NODE_ENV=production`.

Verify the voice-judge fix (or any backend change) reached the running worker:

```bash
grep -q resolveReasoningFields apps/backend/dist/cli/worker-main.js && echo "bundle ok"
```

### Automated deploy (GitHub Actions)

Push to `main` → CI builds artifact → self-hosted runner runs `infra/integrator/scripts/deploy-app.sh`.

The script auto-detects the app directory (`/home/cultiv/app` or `/home/cultiv/cultiv/app`). Override with repo variable `CULTIV_APP=/home/cultiv/app` if needed.

**Common failure:** CI deployed to `/home/cultiv/cultiv/app` while PM2 runs `/home/cultiv/app` — the site keeps serving old bundles until paths align.

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
