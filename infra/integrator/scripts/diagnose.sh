#!/usr/bin/env bash
set -euo pipefail

# =============================================================================
# Cultiv — Diagnostic Report
# =============================================================================
# Gera um relatório completo de diagnóstico do sistema. Útil para debugging
# e troubleshooting.
# =============================================================================

echo "=== Cultiv Diagnostic Report ==="
echo "Time: $(date)"
echo ""

echo "=== System ==="
echo "CPU: $(top -bn1 | grep "Cpu(s)" | awk '{print $2,$3,$4,$5,$6,$7,$8}')"
echo "Memory: $(free -h | grep Mem)"
echo "Disk: $(df -h / | tail -1)"
echo ""

echo "=== Docker ==="
docker ps
docker stats --no-stream --format "table {{.Name}}\t{{.CPUPerc}}\t{{.MemUsage}}"
echo ""

echo "=== PM2 ==="
pm2 status
pm2 monit 2>/dev/null || true
echo ""

echo "=== Database ==="
docker exec cultiv-postgres psql -U cultiv -c "SELECT COUNT(*) as total_jobs, status FROM jobs GROUP BY status;" 2>/dev/null || echo "Cannot query database"
docker exec cultiv-postgres psql -U cultiv -c "SELECT COUNT(*) as unpublished FROM outbox_events WHERE published_at IS NULL;" 2>/dev/null || echo "Cannot query outbox"
echo ""

echo "=== Recent Errors ==="
tail -n 20 ${CULTIV_ROOT:-/home/cultiv/cultiv}/logs/api-err.log 2>/dev/null || echo "No error logs"
tail -n 20 ${CULTIV_ROOT:-/home/cultiv/cultiv}/logs/worker-err.log 2>/dev/null || echo "No worker error logs"
echo ""

echo "=== Health Check Log ==="
tail -n 5 ${CULTIV_ROOT:-/home/cultiv/cultiv}/logs/health-check.log 2>/dev/null || echo "No health check logs"
echo ""

echo "=== Metrics ==="
cat ${CULTIV_ROOT:-/home/cultiv/cultiv}/metrics/current.json 2>/dev/null || echo "No metrics available"
echo ""

echo "=== End of Report ==="
