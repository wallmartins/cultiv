#!/usr/bin/env bash
set -euo pipefail

# Build on the VPS after `git pull` (source-only sync does NOT update dist bundles).
#
# Usage (on VPS):
#   cd /home/cultiv/app
#   git pull
#   ./infra/integrator/scripts/manual-build-deploy.sh

resolve_cultiv_app_dir() {
  if [ -n "${CULTIV_APP:-}" ]; then
    echo "$CULTIV_APP"
    return 0
  fi

  for candidate in "$(pwd)" /home/cultiv/app /home/cultiv/cultiv/app; do
    if [ -f "$candidate/ecosystem.config.cjs" ] && [ -f "$candidate/package.json" ]; then
      echo "$candidate"
      return 0
    fi
  done

  echo "Run from the monorepo app root or set CULTIV_APP." >&2
  exit 1
}

APP_DIR="$(resolve_cultiv_app_dir)"
cd "$APP_DIR"

echo "Building backend in: $APP_DIR"
pnpm install --frozen-lockfile
pnpm build:backend
pnpm --filter @my-ai-orchestrator/backend migrate

pm2 reload ecosystem.config.cjs --only cultiv-api
pm2 restart ecosystem.config.cjs --only cultiv-worker

sleep 3
curl -f http://127.0.0.1:3001/health

echo "Manual build + restart complete."
