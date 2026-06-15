#!/usr/bin/env bash
set -euo pipefail

# =============================================================================
# Cultiv — Health Check & Auto-Recovery Script
# =============================================================================
# Roda a cada 2 minutos via cron. Verifica saúde da API, worker, banco, Redis,
# disco, memória, outbox e jobs travados. Tenta auto-recuperar e alerta no Discord.
# =============================================================================

CULTIV_ROOT="${CULTIV_ROOT:-/home/cultiv/cultiv}"
LOG_FILE="${CULTIV_ROOT}/logs/health-check.log"
WEBHOOK_URL="${DISCORD_WEBHOOK_URL:-}"
API_URL="http://127.0.0.1:3001/health"
READY_URL="http://127.0.0.1:3001/ready"

log() {
  echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"
}

alert() {
  local message="$1"
  log "ALERT: $message"
  if [ -n "$WEBHOOK_URL" ]; then
    curl -s -X POST -H "Content-Type: application/json" \
      -d "{\"content\": \"🚨 Cultiv Health Check: $message\"}" \
      "$WEBHOOK_URL" > /dev/null 2>&1 || true
  fi
}

recover() {
  local service="$1"
  local action="$2"
  log "Attempting recovery: $service → $action"
  eval "$action" || true
  sleep 5
}

# =============================================================================
# Check 1: API responde
# =============================================================================
if ! curl -sf "$API_URL" > /dev/null 2>&1; then
  recover "API" "pm2 reload cultiv-api"
  if ! curl -sf "$API_URL" > /dev/null 2>&1; then
    alert "API health check failed at $API_URL (after restart attempt)"
  else
    alert "API restarted successfully after failure"
  fi
fi

# =============================================================================
# Check 2: Readiness (config, auth, database)
# =============================================================================
READY_STATUS=$(curl -sf "$READY_URL" | jq -r '.status' 2>/dev/null || echo "error")
if [ "$READY_STATUS" != "ready" ]; then
  alert "API readiness is '$READY_STATUS'"
fi

# =============================================================================
# Check 3: Worker online
# =============================================================================
if ! pm2 status cultiv-worker | grep -q "online"; then
  recover "Worker" "pm2 restart cultiv-worker"
  if ! pm2 status cultiv-worker | grep -q "online"; then
    alert "Worker is not online (after restart attempt)"
  fi
fi

# =============================================================================
# Check 4: PostgreSQL
# =============================================================================
if ! docker exec cultiv-postgres pg_isready -U cultiv > /dev/null 2>&1; then
  recover "PostgreSQL" "docker restart cultiv-postgres"
  if ! docker exec cultiv-postgres pg_isready -U cultiv > /dev/null 2>&1; then
    alert "PostgreSQL is not ready (after restart attempt)"
  fi
fi

# =============================================================================
# Check 5: Redis
# =============================================================================
if ! docker exec cultiv-redis redis-cli ping | grep -q "PONG"; then
  recover "Redis" "docker restart cultiv-redis"
  if ! docker exec cultiv-redis redis-cli ping | grep -q "PONG"; then
    alert "Redis is not responding (after restart attempt)"
  fi
fi

# =============================================================================
# Check 6: Disco
# =============================================================================
DISK_USAGE=$(df -h / | awk 'NR==2 {print $5}' | tr -d '%')
if [ "$DISK_USAGE" -gt 80 ]; then
  alert "Disk usage is ${DISK_USAGE}%"
fi

# =============================================================================
# Check 7: Memória
# =============================================================================
MEM_USAGE=$(free | grep Mem | awk '{printf "%.0f", $3/$2 * 100}')
if [ "$MEM_USAGE" -gt 90 ]; then
  alert "Memory usage is ${MEM_USAGE}%"
fi

# =============================================================================
# Check 8: Outbox acumulando
# =============================================================================
UNPUBLISHED=$(docker exec cultiv-postgres psql -U cultiv -t -c \
  "SELECT COUNT(*) FROM outbox_events WHERE published_at IS NULL" 2>/dev/null | tr -d ' ' || echo "0")
if [ "$UNPUBLISHED" -gt 100 ]; then
  alert "Outbox has $UNPUBLISHED unpublished events (relay may be stuck)"
fi

# =============================================================================
# Check 9: Jobs travados
# =============================================================================
STUCK=$(docker exec cultiv-postgres psql -U cultiv -t -c \
  "SELECT COUNT(*) FROM jobs WHERE status = 'running' AND updated_at < NOW() - INTERVAL '30 minutes'" 2>/dev/null | tr -d ' ' || echo "0")
if [ "$STUCK" -gt 0 ]; then
  alert "Found $STUCK jobs stuck in 'running' for > 30 min"
fi

log "Health check completed"
