#!/usr/bin/env bash
set -euo pipefail

# =============================================================================
# Cultiv — Cloudflare Configuration Verification Script
# =============================================================================
# Verifica se o Cloudflare Tunnel, R2, e Zero Trust SSH estão configurados.
# Roda na VPS ou localmente.
# =============================================================================

CULTIV_ROOT="${CULTIV_ROOT:-/home/ubuntu/cultiv}"
WEBHOOK_URL="${DISCORD_WEBHOOK_URL:-}"
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
echo "  Cloudflare Configuration Verification"
echo "=========================================="
echo ""

# =============================================================================
# Check 1: cloudflared installed
# =============================================================================
echo "1. cloudflared installed..."
if command -v cloudflared &> /dev/null; then
  pass "cloudflared installed: $(cloudflared --version 2>/dev/null | head -1)"
else
  fail "cloudflared not installed"
fi

# =============================================================================
# Check 2: cloudflared authenticated
# =============================================================================
echo "2. cloudflared authenticated..."
if [ -f "$HOME/.cloudflared/cert.pem" ]; then
  pass "Certificate found"
else
  fail "Certificate not found (run: cloudflared tunnel login)"
fi

# =============================================================================
# Check 3: tunnel config exists
# =============================================================================
echo "3. Tunnel config..."
if [ -f "$HOME/.cloudflared/config.yml" ]; then
  pass "Config file exists"
  if grep -q "api.cultiv.app" "$HOME/.cloudflared/config.yml" 2>/dev/null; then
    pass "api.cultiv.app configured in tunnel"
  else
    fail "api.cultiv.app not in tunnel config"
  fi
else
  fail "Config file not found"
fi

# =============================================================================
# Check 4: tunnel service running
# =============================================================================
echo "4. Tunnel service..."
if systemctl is-active --quiet cloudflared 2>/dev/null; then
  pass "cloudflared service is active"
else
  fail "cloudflared service not active"
fi

# =============================================================================
# Check 5: DNS resolves
# =============================================================================
echo "5. DNS resolution..."
if command -v dig &> /dev/null; then
  if dig +short api.cultiv.app > /dev/null 2>&1; then
    pass "api.cultiv.app resolves"
  else
    fail "api.cultiv.app does not resolve"
  fi
else
  log "dig not installed, skipping DNS check"
fi

# =============================================================================
# Check 6: HTTPS health check
# =============================================================================
echo "6. HTTPS endpoint..."
if curl -sf "https://api.cultiv.app/health" > /dev/null 2>&1; then
  pass "HTTPS health endpoint responds"
else
  fail "HTTPS not responding (or /health not found)"
fi

# =============================================================================
# Check 7: rclone installed
# =============================================================================
echo "7. rclone installed..."
if command -v rclone &> /dev/null; then
  pass "rclone installed: $(rclone --version 2>/dev/null | head -1)"
else
  fail "rclone not installed"
fi

# =============================================================================
# Check 8: rclone configured for R2
# =============================================================================
echo "8. rclone R2 config..."
if rclone config show 2>/dev/null | grep -q "type = s3" || rclone listremotes 2>/dev/null | grep -q "r2"; then
  pass "rclone S3/R2 remote configured"
else
  fail "rclone R2 remote not configured (run: rclone config)"
fi

# =============================================================================
# Check 9: R2 bucket accessible
# =============================================================================
echo "9. R2 bucket access..."
if rclone lsd r2: 2>/dev/null | grep -q "cultiv-backups" || rclone ls r2:cultiv-backups 2>/dev/null > /dev/null; then
  pass "Bucket 'cultiv-backups' accessible"
else
  fail "Cannot access bucket 'cultiv-backups'"
fi

# =============================================================================
# Check 10: .env has R2 variables
# =============================================================================
echo "10. R2 environment variables..."
if [ -f "${CULTIV_ROOT}/app/.env" ]; then
  if grep -q "R2_BUCKET_NAME" "${CULTIV_ROOT}/app/.env" 2>/dev/null; then
    pass "R2_BUCKET_NAME in .env"
  else
    fail "R2_BUCKET_NAME not in .env"
  fi
  if grep -q "R2_ENDPOINT" "${CULTIV_ROOT}/app/.env" 2>/dev/null; then
    pass "R2_ENDPOINT in .env"
  else
    fail "R2_ENDPOINT not in .env"
  fi
else
  fail ".env file not found"
fi

# =============================================================================
# Check 11: SSH not exposed
# =============================================================================
echo "11. SSH port exposure..."
if command -v ss &> /dev/null; then
  SSH_PUBLIC=$(ss -tlnp | grep -E "0\.0\.0\.0:22|:::22" || true)
  if [ -z "$SSH_PUBLIC" ]; then
    pass "SSH not exposed on 0.0.0.0:22"
  else
    fail "SSH is exposed on public interface"
  fi
else
  log "ss not installed, skipping SSH check"
fi

# =============================================================================
# Check 12: Zero inbound ports
# =============================================================================
echo "12. Zero inbound ports..."
if command -v ss &> /dev/null; then
  PUBLIC_PORTS=$(ss -tlnp | grep -E "0\.0\.0\.0:|:::" | grep -v "127.0.0.1" || true)
  if [ -z "$PUBLIC_PORTS" ]; then
    pass "Zero inbound ports exposed"
  else
    fail "Found exposed ports:"
    echo "$PUBLIC_PORTS"
  fi
else
  log "ss not installed, skipping port check"
fi

# =============================================================================
# Summary
# =============================================================================
echo ""
echo "=========================================="
echo "  Results: ${CHECKS_PASSED} passed, ${CHECKS_FAILED} failed"
echo "=========================================="

if [ "$CHECKS_FAILED" -eq 0 ]; then
  echo "  🎉 All Cloudflare checks passed!"
  if [ -n "$WEBHOOK_URL" ]; then
    curl -s -X POST -H "Content-Type: application/json" \
      -d "{\"content\": \"✅ Cloudflare verification passed: ${CHECKS_PASSED}/${CHECKS_PASSED} checks\"}" \
      "$WEBHOOK_URL" > /dev/null 2>&1 || true
  fi
  exit 0
else
  echo "  ⚠️  ${CHECKS_FAILED} checks failed. Fix before go-live."
  if [ -n "$WEBHOOK_URL" ]; then
    curl -s -X POST -H "Content-Type: application/json" \
      -d "{\"content\": \"⚠️ Cloudflare verification: ${CHECKS_PASSED} passed, ${CHECKS_FAILED} failed\"}" \
      "$WEBHOOK_URL" > /dev/null 2>&1 || true
  fi
  exit 1
fi
