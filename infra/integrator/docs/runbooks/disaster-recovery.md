# Cultiv — Disaster Recovery

## Overview

This runbook covers disaster recovery scenarios for the Cultiv Integrator VPS deployment.

## RPO and RTO

- **RPO (Recovery Point Objective):** 24 hours (daily backup)
- **RTO (Recovery Time Objective):** < 2 hours (manual restore)

## Scenarios

### Scenario A: Database Corruption

**Symptoms:** PostgreSQL errors, data inconsistency, application crashes.

**Steps:**
1. Stop API and Worker: `pm2 stop all`
2. Identify last good backup: `ls -t /home/ubuntu/cultiv/backups/db-*.sql.gz | head -1`
3. Download from Cloudflare R2 if needed:
   ```bash
   rclone copy ":s3:cultiv-backups/db-<latest>.sql.gz" /home/ubuntu/cultiv/backups/ \
     --s3-provider=Cloudflare \
     --s3-endpoint="${R2_ENDPOINT}" \
     --s3-env-auth
   ```
4. Drop and recreate database:
   ```bash
   docker exec cultiv-postgres psql -U cultiv -c "DROP DATABASE cultiv;"
   docker exec cultiv-postgres psql -U cultiv -c "CREATE DATABASE cultiv;"
   ```
5. Restore: `gunzip -c <backup>.sql.gz | docker exec -i cultiv-postgres psql -U cultiv -d cultiv`
6. Run migrations: `pnpm --filter @my-ai-orchestrator/backend migrate`
7. Start services: `pm2 start all`
8. Verify: `curl https://api.cultiv.app/health`

**Time estimate:** 30-60 minutes

### Scenario B: VPS Total Loss

**Symptoms:** VM inaccessible, Integrator failure, accidental termination.

**Steps:**
1. Provision new VPS (Integrator panel)
2. Run bootstrap script: `sudo ./bootstrap-vm.sh`
3. Configure Cloudflare Tunnel (see runbook)
4. Start PostgreSQL + Redis: `docker compose up -d`
5. Download latest backup from Cloudflare R2:
   ```bash
   rclone ls ":s3:cultiv-backups/" \
     --s3-provider=Cloudflare \
     --s3-endpoint="${R2_ENDPOINT}" \
     --s3-env-auth
   rclone copy ":s3:cultiv-backups/db-<latest>.sql.gz" /tmp/ \
     --s3-provider=Cloudflare \
     --s3-endpoint="${R2_ENDPOINT}" \
     --s3-env-auth
   ```
6. Restore database (see Scenario A)
7. Deploy application: `git clone` or artifact deploy
8. Configure `.env` with secrets
9. Start PM2: `pm2 start ecosystem.config.cjs`
10. Verify all services

**Time estimate:** 1-2 hours

### Scenario C: Accidental Data Deletion

**Symptoms:** User deleted, data missing.

**Steps:**
1. Identify affected tables
2. Restore specific table from backup:
   ```bash
   # Extract table from backup
   gunzip -c <backup>.sql.gz | grep -A 1000 "CREATE TABLE <table>" | docker exec -i cultiv-postgres psql -U cultiv
   ```
3. Or restore full database and selectively re-import

### Scenario D: Redis Data Loss

**Symptoms:** Cache miss, session loss, queue problems.

**Steps:**
1. Redis has AOF enabled — restart usually recovers
2. If AOF is corrupted: `docker exec cultiv-redis redis-check-aof /data/appendonly.aof`
3. If unrecoverable: restore from Redis backup (`redis-<date>.rdb`)
4. Or recreate Redis (no persistent business data)

## Backup Verification

Run weekly: `infra/integrator/scripts/verify-backup.sh`

This script:
1. Creates temporary PostgreSQL container
2. Restores latest backup
3. Verifies data integrity
4. Reports to Discord

## Emergency Contacts

- **Integrator Panel:** https://integrator.com.br
- **Cloudflare Dashboard:** https://dash.cloudflare.com
- **Auth0 Dashboard:** https://manage.auth0.com
- **Discord Webhook:** (check `.env` for URL)

## Prevention

- Daily backups (automated)
- Health checks (2 min interval)
- Monitoring alerts (Discord)
- UptimeRobot (external)
- Graceful shutdown (SIGTERM)

## Recovery Checklist

- [ ] Identify failure type
- [ ] Notify team (Discord)
- [ ] Stop services if needed
- [ ] Locate latest backup
- [ ] Restore database
- [ ] Verify data integrity
- [ ] Start services
- [ ] Verify application
- [ ] Update runbook with lessons learned
