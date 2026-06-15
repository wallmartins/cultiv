#!/usr/bin/env bash
set -euo pipefail

# =============================================================================
# Cultiv — Metrics Collector
# =============================================================================
# Coleta métricas de sistema, banco, cache e processos a cada 1 minuto.
# Salva JSON em /home/ubuntu/cultiv/metrics/current.json (servido via Nginx).
# =============================================================================

METRICS_FILE="/home/ubuntu/cultiv/metrics/current.json"
mkdir -p "$(dirname "$METRICS_FILE")"

# CPU
CPU_IDLE=$(top -bn1 | grep "Cpu(s)" | awk '{print $8}')
CPU_USAGE=$(echo "100 - ${CPU_IDLE:-0}" | bc)

# Memória
MEM_TOTAL=$(free -m | awk 'NR==2{printf "%.0f", $2}')
MEM_USED=$(free -m | awk 'NR==2{printf "%.0f", $3}')
MEM_PERCENT=$(echo "scale=0; $MEM_USED * 100 / $MEM_TOTAL" | bc)

# Disco
DISK_USAGE=$(df -h / | awk 'NR==2 {print $5}' | tr -d '%')

# PostgreSQL
PG_SIZE=$(docker exec cultiv-postgres psql -U cultiv -t -c \
  "SELECT pg_size_pretty(pg_database_size('cultiv'))" 2>/dev/null | tr -d ' ' || echo "unknown")
JOBS_QUEUED=$(docker exec cultiv-postgres psql -U cultiv -t -c \
  "SELECT COUNT(*) FROM jobs WHERE status = 'queued'" 2>/dev/null | tr -d ' ' || echo "0")
JOBS_RUNNING=$(docker exec cultiv-postgres psql -U cultiv -t -c \
  "SELECT COUNT(*) FROM jobs WHERE status = 'running'" 2>/dev/null | tr -d ' ' || echo "0")
JOBS_COMPLETED=$(docker exec cultiv-postgres psql -U cultiv -t -c \
  "SELECT COUNT(*) FROM jobs WHERE status = 'completed'" 2>/dev/null | tr -d ' ' || echo "0")
OUTBOX_UNPUBLISHED=$(docker exec cultiv-postgres psql -U cultiv -t -c \
  "SELECT COUNT(*) FROM outbox_events WHERE published_at IS NULL" 2>/dev/null | tr -d ' ' || echo "0")

# Redis
REDIS_KEYS=$(docker exec cultiv-redis redis-cli dbsize 2>/dev/null || echo "0")

# PM2
PM2_PROCESSES=$(pm2 jlist 2>/dev/null | jq -r '.[] | "\(.name): \(.pm2_env.status)"' | tr '\n' ', ' || echo "unknown")

cat > "$METRICS_FILE" <<EOF
{
  "timestamp": "$(date -Iseconds)",
  "system": {
    "cpu_percent": ${CPU_USAGE},
    "memory_used_mb": ${MEM_USED},
    "memory_total_mb": ${MEM_TOTAL},
    "memory_percent": ${MEM_PERCENT},
    "disk_percent": ${DISK_USAGE}
  },
  "database": {
    "pg_size": "${PG_SIZE}",
    "jobs_queued": ${JOBS_QUEUED},
    "jobs_running": ${JOBS_RUNNING},
    "jobs_completed": ${JOBS_COMPLETED},
    "outbox_unpublished": ${OUTBOX_UNPUBLISHED}
  },
  "cache": {
    "redis_keys": ${REDIS_KEYS}
  },
  "processes": {
    "pm2": "${PM2_PROCESSES}"
  }
}
EOF
