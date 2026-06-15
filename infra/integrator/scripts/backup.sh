#!/usr/bin/env bash
set -euo pipefail

# =============================================================================
# Cultiv — Daily Backup Script
# =============================================================================
# Roda diariamente às 03:00 via cron. Faz backup de PostgreSQL e Redis,
# envia para Cloudflare R2 e notifica no Discord.
# =============================================================================

CULTIV_ROOT="/home/ubuntu/cultiv"
BACKUP_DIR="${CULTIV_ROOT}/backups"
R2_BUCKET="${R2_BUCKET_NAME:-cultiv-backups}"
R2_ENDPOINT="${R2_ENDPOINT:-}"
RETENTION_DAYS=7
WEBHOOK_URL="${DISCORD_WEBHOOK_URL:-}"
LOG_FILE="${CULTIV_ROOT}/logs/backup.log"

DATE=$(date +%F-%H%M)

log() {
  echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"
}

notify() {
  local msg="$1"
  log "$msg"
  if [ -n "$WEBHOOK_URL" ]; then
    curl -s -X POST -H "Content-Type: application/json" \
      -d "{\"content\": \"✅ $msg\"}" \
      "$WEBHOOK_URL" > /dev/null 2>&1 || true
  fi
}

alert() {
  local msg="$1"
  log "ALERT: $msg"
  if [ -n "$WEBHOOK_URL" ]; then
    curl -s -X POST -H "Content-Type: application/json" \
      -d "{\"content\": \"🚨 Cultiv Backup: $msg\"}" \
      "$WEBHOOK_URL" > /dev/null 2>&1 || true
  fi
}

log "Starting backup..."
mkdir -p "$BACKUP_DIR"

# PostgreSQL
log "Backing up PostgreSQL..."
if docker exec cultiv-postgres pg_dump -U cultiv cultiv | gzip > "${BACKUP_DIR}/db-${DATE}.sql.gz"; then
  log "PostgreSQL backup OK"
else
  alert "PostgreSQL dump failed"
  exit 1
fi

# Redis
log "Backing up Redis..."
if docker exec cultiv-redis redis-cli BGSAVE; then
  sleep 2
  if docker cp cultiv-redis:/data/dump.rdb "${BACKUP_DIR}/redis-${DATE}.rdb"; then
    log "Redis backup OK"
  else
    alert "Redis copy failed"
    exit 1
  fi
else
  alert "Redis BGSAVE failed"
  exit 1
fi

# Upload to Cloudflare R2
log "Uploading to Cloudflare R2..."

# Verificar se rclone está configurado
if ! command -v rclone &> /dev/null; then
  alert "rclone not installed — cannot upload to R2"
  exit 1
fi

# Upload PostgreSQL backup
if rclone copy "${BACKUP_DIR}/db-${DATE}.sql.gz" ":s3:${R2_BUCKET}/" \
  --s3-provider=Cloudflare \
  --s3-endpoint="${R2_ENDPOINT}" \
  --s3-env-auth \
  --s3-no-check-bucket \
  --quiet; then
  log "DB upload to R2 OK"
else
  alert "DB upload to Cloudflare R2 failed"
fi

# Upload Redis backup
if rclone copy "${BACKUP_DIR}/redis-${DATE}.rdb" ":s3:${R2_BUCKET}/" \
  --s3-provider=Cloudflare \
  --s3-endpoint="${R2_ENDPOINT}" \
  --s3-env-auth \
  --s3-no-check-bucket \
  --quiet; then
  log "Redis upload to R2 OK"
else
  alert "Redis upload to Cloudflare R2 failed"
fi

# Cleanup local
find "$BACKUP_DIR" -name "db-*.sql.gz" -mtime +$RETENTION_DAYS -delete
find "$BACKUP_DIR" -name "redis-*.rdb" -mtime +$RETENTION_DAYS -delete
log "Local cleanup done"

notify "Cultiv backup completed: $DATE"
