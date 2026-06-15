#!/usr/bin/env bash
set -euo pipefail

# =============================================================================
# Cultiv — Go-Live Verification Script
# =============================================================================
# Script interativo que verifica todos os itens do checklist antes do go-live.
# Roda na VM ou localmente (via Cloudflare Tunnel).
# =============================================================================

CULTIV_ROOT="/home/ubuntu/cultiv"
API_URL="${API_URL:-https://api.cultiv.app}"
CHECKS_PASSED=0
CHECKS_FAILED=0

log() {
  echo "  $1"
}

pass() {
  echo "  ✅ $1"
  ((CHECKS_PASSED++)) || true
}

fail() {
  echo "  ❌ $1"
  ((CHECKS_FAILED++)) || true
}

# =============================================================================
# Header
# =============================================================================
echo "=========================================="
echo "  Cultiv Go-Live Verification"
echo "=========================================="
echo ""
echo "API: ${API_URL}"
echo ""

# =============================================================================
# Check 1: DNS resolves
# =============================================================================
echo "1. DNS resolution..."
if dig +short api.cultiv.app > /dev/null 2>&1; then
  pass "DNS resolves"
else
  fail "DNS does not resolve"
fi

# =============================================================================
# Check 2: SSL
# =============================================================================
echo "2. SSL certificate..."
if curl -sf -o /dev/null -I "${API_URL}/health" 2>&1 | grep -q "SSL certificate"; then
  pass "SSL valid"
else
  # Actually check if HTTPS works
  if curl -sf "${API_URL}/health" > /dev/null 2>&1; then
    pass "HTTPS responds"
  else
    fail "HTTPS not responding"
  fi
fi

# =============================================================================
# Check 3: Health endpoint
# =============================================================================
echo "3. Health endpoint..."
HEALTH=$(curl -sf "${API_URL}/health" 2>/dev/null || echo "")
if [ -n "$HEALTH" ]; then
  pass "Health endpoint responds"
  log "Response: $HEALTH"
else
  fail "Health endpoint not responding"
fi

# =============================================================================
# Check 4: Readiness endpoint
# =============================================================================
echo "4. Readiness endpoint..."
READY=$(curl -sf "${API_URL}/ready" 2>/dev/null || echo "")
if [ -n "$READY" ]; then
  READY_STATUS=$(echo "$READY" | jq -r '.status' 2>/dev/null || echo "unknown")
  if [ "$READY_STATUS" = "ready" ]; then
    pass "Readiness is 'ready'"
  else
    fail "Readiness is '$READY_STATUS'"
  fi
else
  fail "Readiness endpoint not responding"
fi

# =============================================================================
# Check 5: Metrics endpoint
# =============================================================================
echo "5. Metrics endpoint..."
METRICS=$(curl -sf "${API_URL}/metrics" 2>/dev/null || echo "")
if [ -n "$METRICS" ]; then
  pass "Metrics endpoint responds"
else
  fail "Metrics endpoint not responding"
fi

# =============================================================================
# Check 6: PostgreSQL
# =============================================================================
echo "6. PostgreSQL..."
if docker exec cultiv-postgres pg_isready -U cultiv > /dev/null 2>&1; then
  pass "PostgreSQL is ready"
else
  fail "PostgreSQL is not ready"
fi

# =============================================================================
# Check 7: Redis
# =============================================================================
echo "7. Redis..."
if docker exec cultiv-redis redis-cli ping | grep -q "PONG"; then
  pass "Redis is responding"
else
  fail "Redis is not responding"
fi

# =============================================================================
# Check 8: API process
# =============================================================================
echo "8. API process..."
if pm2 status cultiv-api | grep -q "online"; then
  pass "API is online"
else
  fail "API is not online"
fi

# =============================================================================
# Check 9: Worker process
# =============================================================================
echo "9. Worker process..."
if pm2 status cultiv-worker | grep -q "online"; then
  pass "Worker is online"
else
  fail "Worker is not online"
fi

# =============================================================================
# Check 10: Outbox
# =============================================================================
echo "10. Outbox..."
UNPUBLISHED=$(docker exec cultiv-postgres psql -U cultiv -t -c \
  "SELECT COUNT(*) FROM outbox_events WHERE published_at IS NULL" 2>/dev/null | tr -d ' ' || echo "0")
if [ "$UNPUBLISHED" -eq 0 ]; then
  pass "Outbox is empty"
else
  fail "Outbox has $UNPUBLISHED unpublished events"
fi

# =============================================================================
# Check 11: Disk
# =============================================================================
echo "11. Disk usage..."
DISK=$(df -h / | awk 'NR==2 {print $5}' | tr -d '%')
if [ "$DISK" -lt 80 ]; then
  pass "Disk usage is ${DISK}%"
else
  fail "Disk usage is ${DISK}% (too high)"
fi

# =============================================================================
# Check 12: Memory
# =============================================================================
echo "12. Memory usage..."
MEM=$(free | grep Mem | awk '{printf "%.0f", $3/$2 * 100}')
if [ "$MEM" -lt 90 ]; then
  pass "Memory usage is ${MEM}%"
else
  fail "Memory usage is ${MEM}% (too high)"
fi

# =============================================================================
# Check 13: Health check script
# =============================================================================
echo "13. Health check log..."
if [ -f "${CULTIV_ROOT}/logs/health-check.log" ]; then
  LAST_RUN=$(tail -1 "${CULTIV_ROOT}/logs/health-check.log" | cut -d' ' -f1,2)
  pass "Health check log exists (last: $LAST_RUN)"
else
  fail "Health check log not found"
fi

# =============================================================================
# Check 14: Backup
# =============================================================================
echo "14. Backup..."
if [ -d "${CULTIV_ROOT}/backups" ] && [ "$(ls -A ${CULTIV_ROOT}/backups)" ]; then
  pass "Backup directory has files"
else
  fail "No backup files found"
fi

# =============================================================================
# Summary
# =============================================================================
echo ""
echo "=========================================="
echo "  Results: ${CHECKS_PASSED} passed, ${CHECKS_FAILED} failed"
echo "=========================================="

if [ "$CHECKS_FAILED" -eq 0 ]; then
  echo "  🎉 All checks passed! Ready for go-live."
  exit 0
else
  echo "  ⚠️  ${CHECKS_FAILED} checks failed. Fix before go-live."
  exit 1
fi
