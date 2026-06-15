#!/usr/bin/env bash
set -euo pipefail

# =============================================================================
# Cultiv — Daily Log Summary
# =============================================================================
# Envia resumo de erros e warnings do dia anterior para o Discord.
# Roda às 08:00 via cron.
# =============================================================================

WEBHOOK_URL="${DISCORD_WEBHOOK_URL:-}"
LOG_DIR="${CULTIV_ROOT:-/home/cultiv/cultiv}/logs"
YESTERDAY=$(date -d "yesterday" +%F)

ERROR_COUNT=$(grep -ci "error\|ERROR\|failed\|FAIL" "${LOG_DIR}/api-err.log" 2>/dev/null || echo 0)
WARN_COUNT=$(grep -ci "warn\|WARN" "${LOG_DIR}/api-out.log" 2>/dev/null || echo 0)

JOBS_COUNT=$(docker exec cultiv-postgres psql -U cultiv -t -c \
  "SELECT COUNT(*) FROM jobs WHERE created_at >= '${YESTERDAY}'" 2>/dev/null | tr -d ' ' || echo "0")

if [ -n "$WEBHOOK_URL" ]; then
  curl -s -X POST -H "Content-Type: application/json" \
    -d "{\"content\": \"📊 Cultiv Daily Summary (${YESTERDAY})\\n• Errors: ${ERROR_COUNT}\\n• Warnings: ${WARN_COUNT}\\n• Jobs created: ${JOBS_COUNT}\"}" \
    "$WEBHOOK_URL" > /dev/null 2>&1 || true
fi
