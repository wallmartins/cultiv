---
title: Monitoring and Alerting
doc_type: issue
status: ready-for-agent
domain: backend-platform
slice_type: AFK
last_updated: 2026-06-15
---

# Monitoring and alerting

## Parent

- [`issue-integrator-cloudflare-deploy.md`](../prd/issue-integrator-cloudflare-deploy.md)
- ADR: [`0005-integrator-cloudflare-deploy.md`](../../adr/0005-integrator-cloudflare-deploy.md)

## What to build

Implement automated health checks, metrics collection, alerting, and a lightweight operational dashboard. The goal is to detect failures within 2-5 minutes and notify via Discord (or email) without manual monitoring.

### Deliverables

1. **Health check script**
   - `scripts/health-check.sh` in `/home/ubuntu/cultiv/`
   - Checks every 2 minutes via cron:
     - API `/health` responds with 200
     - API `/ready` responds with `status: ready`
     - Worker process is online (`pm2 status cultiv-worker | grep online`)
     - PostgreSQL responds (`pg_isready`)
     - Redis responds (`redis-cli ping`)
     - Disk usage < 80% (`df`)
     - Memory usage < 90% (`free`)
     - Outbox unpublished events < 100 (`SELECT COUNT(*) FROM outbox_events WHERE published_at IS NULL`)
     - Stuck jobs < 1 (`SELECT COUNT(*) FROM jobs WHERE status = 'running' AND updated_at < NOW() - INTERVAL '30 minutes'`)
   - Auto-recovery attempts:
     - If API down: `pm2 reload cultiv-api`
     - If worker down: `pm2 restart cultiv-worker`
     - If PostgreSQL down: `docker restart cultiv-postgres`
     - If Redis down: `docker restart cultiv-redis`
   - After auto-recovery, re-check. If still failing, send alert.
   - Alert format: Discord webhook with emoji and concise message
   - Log all checks to `/home/ubuntu/cultiv/logs/health-check.log`

2. **Metrics collector script**
   - `scripts/metrics-collector.sh` in `/home/ubuntu/cultiv/`
   - Runs every 1 minute via cron
   - Collects:
     - System: CPU %, memory used/total, disk %
     - Database: PostgreSQL size, jobs count by status, outbox unpublished count
     - Cache: Redis key count
     - Processes: PM2 process status
   - Writes JSON to `/home/ubuntu/cultiv/metrics/current.json`
   - Nginx serves this file at `/metrics` (no auth for MVP; consider IP whitelist later)
   - JSON format: timestamp, system, database, cache, processes

3. **Log summary script**
   - `scripts/log-summary.sh` in `/home/ubuntu/cultiv/`
   - Runs daily at 08:00 via cron
   - Counts errors and warnings in API/worker logs from previous day
   - Sends summary to Discord: "📊 Cultiv Daily Summary (YYYY-MM-DD): Errors: X, Warnings: Y"
   - No alert — purely informational

4. **Discord webhook integration**
   - Webhook URL stored in environment variable `DISCORD_WEBHOOK_URL`
   - All scripts use the same webhook
   - Messages tagged with emoji: 🚨 (alert), ✅ (recovery), 📊 (summary), 🚀 (deploy)
   - Keep messages concise (< 2000 chars)

5. **UptimeRobot (external monitor)**
   - Create free account at uptimerobot.com
   - Monitor: `https://api.cultiv.app/health` (or configured domain)
   - Interval: 5 minutes
   - Alert: email + Discord (via webhook integration or email forwarding)
   - Second monitor: `https://api.cultiv.app/ready` (catches config/auth/database issues)

6. **PM2 monitoring**
   - `pm2 monit` shows real-time CPU/RAM for API and Worker
   - `pm2 logs` streams logs
   - `pm2 status` shows process status
   - Document these commands in runbook

7. **Systemd auto-start**
   - `pm2 startup systemd` (generates systemd service)
   - `pm2 save` (saves process list)
   - Docker: `systemctl enable docker`
   - cloudflared: already enabled during issue 59
   - Nginx: `systemctl enable nginx`
   - Ensures all services restart after VM reboot

## Acceptance criteria

- [ ] Health check script runs every 2 minutes and logs to file.
- [ ] Health check auto-recovers from simulated failures (API stop, worker stop, PG stop, Redis stop).
- [ ] Discord alert received when auto-recovery fails.
- [ ] Metrics collector runs every 1 minute and produces valid JSON.
- [ ] `curl http://127.0.0.1/metrics` (via Nginx) returns JSON.
- [ ] Log summary script runs daily and sends Discord message.
- [ ] UptimeRobot monitor configured and responding.
- [ ] UptimeRobot alert received when API is down (tested by stopping PM2 temporarily).
- [ ] PM2 auto-starts after simulated VM reboot (or documented).
- [ ] All scripts documented in `docs/runbooks/monitoring-alerting.md`.

## Blocked by

- Issue 61 (Backend must be deployed before health checks can target it)
- Issue 60 (Docker, PM2, Nginx must be installed)
- Issue 59 (Cloudflare Tunnel must be active for external monitoring)
- Discord webhook URL (must be created in Discord server settings)

## Notes

- Health check script is the most critical. Spend extra time testing failure scenarios.
- The metrics JSON is simple but sufficient for MVP. No need for Prometheus/Grafana yet.
- Consider adding a second monitor for `https://api.cultiv.app/ready` in UptimeRobot.
- If Discord is not available, UptimeRobot email alerts are sufficient for MVP.
- All scripts should be idempotent and safe to run manually.
