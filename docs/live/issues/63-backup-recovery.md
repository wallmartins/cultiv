---
title: Backup and Disaster Recovery
doc_type: issue
status: ready-for-agent
domain: backend-platform
slice_type: AFK
last_updated: 2026-06-15
---

# Backup and disaster recovery

## Parent

- [`issue-integrator-cloudflare-deploy.md`](../prd/issue-integrator-cloudflare-deploy.md)
- ADR: [`0005-integrator-cloudflare-deploy.md`](../../adr/0005-integrator-cloudflare-deploy.md)

## What to build

Implement automated daily backups of PostgreSQL and Redis to Cloudflare R2, with documented disaster recovery procedures. The goal is RPO (Recovery Point Objective) of 24 hours and RTO (Recovery Time Objective) of under 2 hours.

### Deliverables

1. **Cloudflare R2 bucket**
   - Create bucket: `cultiv-backups` (or configured name)
   - Region: same as VM (São Paulo or Ashburn)
   - Storage tier: Standard (free tier includes 10GB)
   - No public access (private bucket)
   - rclone configured on VM with API key (for programmatic upload)

2. **Backup script**
   - `scripts/backup.sh` in `/home/ubuntu/cultiv/`
   - Runs daily at 03:00 UTC via cron
   - Steps:
     1. Create timestamp: `DATE=$(date +%F-%H%M)`
     2. PostgreSQL dump: `docker exec cultiv-postgres pg_dump -U cultiv cultiv | gzip > /home/ubuntu/cultiv/backups/db-$DATE.sql.gz`
     3. Redis snapshot: `docker exec cultiv-redis redis-cli BGSAVE`, wait, then `docker cp cultiv-redis:/data/dump.rdb /home/ubuntu/cultiv/backups/redis-$DATE.rdb`
     4. Upload to Object Storage:
        - `rclone copy put ":s3:cultiv-backups" --file /home/ubuntu/cultiv/backups/db-$DATE.sql.gz`
        - `rclone copy put ":s3:cultiv-backups" --file /home/ubuntu/cultiv/backups/redis-$DATE.rdb`
     5. Verify upload: `rclone copy list ":s3:cultiv-backups" | grep $DATE`
     6. Local cleanup: delete files older than 7 days (`find ... -mtime +7 -delete`)
     7. Object Storage cleanup: delete objects older than 30 days (OCI lifecycle policy or manual script)
     8. Notify: Discord webhook "✅ Cultiv backup completed: $DATE"
   - Log all output to `/home/ubuntu/cultiv/logs/backup.log`
   - On failure: Discord alert "🚨 Cultiv backup failed: $DATE"

3. **Backup verification script**
   - `scripts/verify-backup.sh` in `/home/ubuntu/cultiv/`
   - Runs weekly (or monthly) to verify backup integrity
   - Downloads latest backup from Object Storage
   - Restores to a temporary Docker container (different port, e.g., 5433)
   - Runs `pg_dump` validation or simple query: `SELECT COUNT(*) FROM jobs`
   - Deletes temporary container after verification
   - Reports: Discord notification with result
   - This ensures backups are not just present but actually restorable

4. **Disaster recovery runbook**
   - `docs/runbooks/disaster-recovery.md`
   - Scenarios:
     - **Scenario A: Database corruption** → restore from backup
     - **Scenario B: VM total loss** → provision new VM, run bootstrap, restore from backup
     - **Scenario C: Accidental data deletion** → restore specific tables from backup
     - **Scenario D: Redis data loss** → restore from AOF (automatic) or from backup
   - Step-by-step commands for each scenario
   - Include rclone commands for downloading from Object Storage
   - Include `pg_restore` or `psql` commands for restoring
   - Include time estimates for each scenario

5. **Environment secrets backup**
   - `.env` file and `ecosystem.config.cjs` must be backed up manually (or via script) to password manager
   - Document: secrets are NOT in the backup script (they are in the password manager)
   - If `.env` is lost, recreate from password manager

6. **Retention policy**
   - Local backups: 7 days (on VM disk, 200GB limit)
   - Object Storage backups: 30 days (10GB free tier, monitor usage)
   - OCI lifecycle policy: auto-delete objects older than 30 days (if supported in free tier)
   - If retention needs to exceed 30 days: download to local storage periodically

## Acceptance criteria

- [ ] Object Storage bucket `cultiv-backups` created and private.
- [ ] rclone configured on VM with working credentials.
- [ ] Backup script runs manually and successfully uploads to Object Storage.
- [ ] Backup script runs via cron (03:00 daily) and uploads successfully.
- [ ] Discord notification received on backup success.
- [ ] Backup verification script runs and confirms backup is restorable.
- [ ] Restore from backup tested on a temporary container (at least once).
- [ ] Disaster recovery runbook documented and reviewed.
- [ ] RPO confirmed: 24 hours (daily backup).
- [ ] RTO estimated: < 2 hours (documented in runbook).

## Blocked by

- Issue 60 (VM must be bootstrapped with Docker, PostgreSQL, Redis, rclone)
- Issue 61 (Database must be populated with data before backup is meaningful)
- Integrator Object Storage must be enabled in the tenancy

## Notes

- The first backup is critical. Test it manually before relying on cron.
- Backup verification is often overlooked but essential. A corrupted backup is worse than no backup.
- Object Storage 10GB is generous for a side project. Monitor usage monthly.
- Consider encrypting backups before upload (optional, but `pg_dump` output can contain PII).
- The `.env` file is the most critical secret — if lost, the entire deployment is unrecoverable without it. Store in password manager.
- Document the rclone auth key generation process (API key in Integrator hPanel).
