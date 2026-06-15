# Monitoring and Alerting

## Overview

This runbook describes the monitoring and alerting setup for the Cultiv Integrator VPS deployment.

## Components

### Health Check Script

- **File:** `/home/ubuntu/cultiv/scripts/health-check.sh`
- **Frequency:** Every 2 minutes (cron)
- **Checks:**
  - API `/health` endpoint
  - API `/ready` endpoint
  - Worker process status
  - PostgreSQL connectivity
  - Redis connectivity
  - Disk usage (< 80%)
  - Memory usage (< 90%)
  - Outbox accumulation (< 100)
  - Stuck jobs (> 30 min)

**Auto-recovery:**
- API down → `pm2 reload cultiv-api`
- Worker down → `pm2 restart cultiv-worker`
- PostgreSQL down → `docker restart cultiv-postgres`
- Redis down → `docker restart cultiv-redis`

**Alerting:** Discord webhook on failure

### Metrics Collector

- **File:** `/home/ubuntu/cultiv/scripts/metrics-collector.sh`
- **Frequency:** Every 1 minute (cron)
- **Output:** `/home/ubuntu/cultiv/metrics/current.json`
- **Access:** `https://api.cultiv.app/metrics` (via Nginx)

**Metrics collected:**
- CPU usage
- Memory usage
- Disk usage
- PostgreSQL size
- Job counts (queued, running, completed)
- Outbox unpublished count
- Redis key count
- PM2 process status

### Log Summary

- **File:** `/home/ubuntu/cultiv/scripts/log-summary.sh`
- **Frequency:** Daily at 08:00 UTC (cron)
- **Output:** Discord message
- **Content:** Error count, warning count, jobs created

### Backup Verification

- **File:** `/home/ubuntu/cultiv/scripts/verify-backup.sh`
- **Frequency:** Weekly (Sunday at 04:00 UTC)
- **Action:** Restores backup to temporary container and validates
- **Output:** Discord notification

### UptimeRobot

- **URL:** https://uptimerobot.com
- **Monitors:**
  - `https://api.cultiv.app/health` (5 min interval)
  - `https://api.cultiv.app/ready` (5 min interval)
- **Alerts:** Email + Discord
- **Free tier:** Up to 50 monitors

### Discord Notifications

**Webhook setup:**
1. Create Discord server (or use existing)
2. Server Settings → Integrations → Webhooks
3. Create webhook for #alerts channel
4. Copy URL to `.env`: `DISCORD_WEBHOOK_URL`

**Message types:**
- 🚨 Health check failure
- ✅ Recovery successful
- ✅ Deploy successful
- 🚨 Deploy failed
- ✅ Backup completed
- 🚨 Backup failed
- 📊 Daily summary
- ⚠️ Backup verification warning

## Cron Schedule

```bash
# Health check
*/2 * * * * /home/ubuntu/cultiv/scripts/health-check.sh

# Metrics
* * * * * /home/ubuntu/cultiv/scripts/metrics-collector.sh

# Backup
0 3 * * * /home/ubuntu/cultiv/scripts/backup.sh

# Backup verification
0 4 * * 0 /home/ubuntu/cultiv/scripts/verify-backup.sh

# Log summary
0 8 * * * /home/ubuntu/cultiv/scripts/log-summary.sh
```

## Log Locations

| Log | Path |
|-----|------|
| API stdout | `/home/ubuntu/cultiv/logs/api-out.log` |
| API stderr | `/home/ubuntu/cultiv/logs/api-err.log` |
| Worker stdout | `/home/ubuntu/cultiv/logs/worker-out.log` |
| Worker stderr | `/home/ubuntu/cultiv/logs/worker-err.log` |
| Health check | `/home/ubuntu/cultiv/logs/health-check.log` |
| Backup | `/home/ubuntu/cultiv/logs/backup.log` |
| Metrics | `/home/ubuntu/cultiv/logs/metrics.log` |

## Log Rotation

- **Config:** `/etc/logrotate.d/cultiv`
- **Policy:** Daily, 14 days retention, compress
- **PM2 logs:** 7 days retention, `copytruncate`

## Commands

```bash
# View real-time logs
pm2 logs
pm2 logs cultiv-api
pm2 logs cultiv-worker

# View metrics
cat /home/ubuntu/cultiv/metrics/current.json

# Check health
tail -f /home/ubuntu/cultiv/logs/health-check.log

# Check system status
pm2 status
docker ps
pm2 monit

# Simulate failure (for testing)
pm2 stop cultiv-api
# Wait 2 minutes, check Discord for alert
pm2 start cultiv-api
```

## Troubleshooting

**Health check not running:**
```bash
sudo crontab -l
# Should show health-check.sh entry
sudo service cron status
```

**Discord alerts not received:**
```bash
# Test webhook
curl -X POST -H "Content-Type: application/json" \
  -d '{"content": "Test"}' \
  $DISCORD_WEBHOOK_URL
```

**Metrics not updating:**
```bash
# Check cron
ls -la /home/ubuntu/cultiv/metrics/current.json
# Check permissions
sudo chown ubuntu:ubuntu /home/ubuntu/cultiv/metrics
```

## Alert Escalation

1. **Automated:** Health check auto-recovers
2. **Discord:** Notification sent to operator
3. **Email:** UptimeRobot sends email
4. **Manual:** Operator SSH into VPS (via Zero Trust)

## Maintenance

- Review Discord alerts weekly
- Check UptimeRobot dashboard monthly
- Verify log rotation is working
- Clean up old logs (> 14 days)
- Review metrics trends
