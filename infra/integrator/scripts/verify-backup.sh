#!/usr/bin/env bash
set -euo pipefail

# =============================================================================
# Cultiv — Backup Verification Script
# =============================================================================
# Roda semanalmente para verificar se o backup mais recente é restaurável.
# Cria container temporário e restaura o backup.
# =============================================================================

CULTIV_ROOT="${CULTIV_ROOT:-/home/cultiv/cultiv}"
BACKUP_DIR="${CULTIV_ROOT}/backups"
WEBHOOK_URL="${DISCORD_WEBHOOK_URL:-}"

LATEST_BACKUP=$(ls -t ${BACKUP_DIR}/db-*.sql.gz 2>/dev/null | head -1)

if [ -z "$LATEST_BACKUP" ]; then
  if [ -n "$WEBHOOK_URL" ]; then
    curl -s -X POST -H "Content-Type: application/json" \
      -d "{\"content\": \"⚠️ Cultiv Backup Verification: No backup found!\"}" \
      "$WEBHOOK_URL" > /dev/null 2>&1 || true
  fi
  exit 1
fi

# Container temporário
TEMP_CONTAINER="cultiv-postgres-verify"
docker run -d --name "$TEMP_CONTAINER" \
  -e POSTGRES_USER=cultiv \
  -e POSTGRES_PASSWORD=verify \
  -e POSTGRES_DB=cultiv \
  -p 127.0.0.1:5433:5432 \
  postgres:16-alpine > /dev/null 2>&1

sleep 5

# Restore
gunzip -c "$LATEST_BACKUP" | docker exec -i "$TEMP_CONTAINER" psql -U cultiv -d cultiv > /dev/null 2>&1

# Verify
RESULT=$(docker exec "$TEMP_CONTAINER" psql -U cultiv -t -c "SELECT COUNT(*) FROM jobs" 2>/dev/null | tr -d ' ' || echo "error")

# Cleanup
docker rm -f "$TEMP_CONTAINER" > /dev/null 2>&1

if [ "$RESULT" != "error" ] && [ -n "$RESULT" ]; then
  if [ -n "$WEBHOOK_URL" ]; then
    curl -s -X POST -H "Content-Type: application/json" \
      -d "{\"content\": \"✅ Cultiv Backup Verification: Backup is valid (${RESULT} jobs in backup)\"}" \
      "$WEBHOOK_URL" > /dev/null 2>&1 || true
  fi
else
  if [ -n "$WEBHOOK_URL" ]; then
    curl -s -X POST -H "Content-Type: application/json" \
      -d "{\"content\": \"🚨 Cultiv Backup Verification: BACKUP IS CORRUPTED OR INVALID!\"}" \
      "$WEBHOOK_URL" > /dev/null 2>&1 || true
  fi
  exit 1
fi
