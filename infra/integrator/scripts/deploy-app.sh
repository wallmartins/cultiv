#!/usr/bin/env bash
set -euo pipefail

# Deploy pre-built backend artifact into the live Cultiv app directory and restart PM2.
#
# Artifact layout (from CI):
#   $ARTIFACT_DIR/apps/backend/dist
#   $ARTIFACT_DIR/apps/backend/policies
#   $ARTIFACT_DIR/packages/*/dist
#
# Environment:
#   ARTIFACT_DIR   — required; path to extracted artifact (e.g. /tmp/deploy-artifact)
#   CULTIV_APP     — optional; explicit app root (e.g. /home/cultiv/app)
#   CULTIV_ROOT    — optional; parent of app (e.g. /home/cultiv or /home/cultiv/cultiv)

ARTIFACT_DIR="${ARTIFACT_DIR:?ARTIFACT_DIR is required}"

resolve_cultiv_app_dir() {
  if [ -n "${CULTIV_APP:-}" ] && [ -d "$CULTIV_APP" ]; then
    echo "$CULTIV_APP"
    return 0
  fi

  if [ -n "${CULTIV_ROOT:-}" ] && [ -d "${CULTIV_ROOT}/app" ]; then
    echo "${CULTIV_ROOT}/app"
    return 0
  fi

  for candidate in /home/cultiv/app /home/cultiv/cultiv/app; do
    if [ -f "$candidate/ecosystem.config.cjs" ]; then
      echo "$candidate"
      return 0
    fi
  done

  echo "Could not resolve Cultiv app directory. Set CULTIV_APP or CULTIV_ROOT." >&2
  exit 1
}

APP_DIR="$(resolve_cultiv_app_dir)"
ECOSYSTEM_FILE="$APP_DIR/ecosystem.config.cjs"
WORKER_BUNDLE="$APP_DIR/apps/backend/dist/cli/worker-main.js"

echo "Deploying backend artifact to: $APP_DIR"

if [ ! -f "$ECOSYSTEM_FILE" ]; then
  echo "Missing PM2 ecosystem file: $ECOSYSTEM_FILE" >&2
  exit 1
fi

if [ ! -d "$ARTIFACT_DIR/apps/backend/dist" ]; then
  echo "Missing artifact dist: $ARTIFACT_DIR/apps/backend/dist" >&2
  exit 1
fi

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PRUNE_SCRIPT="$SCRIPT_DIR/prune-stale-migration-bundles.sh"

cd "$APP_DIR"

if [ -n "${CHECKOUT_DIR:-}" ] && [ -d "$CHECKOUT_DIR/apps/backend/src/infra/migrations" ]; then
  mkdir -p apps/backend/src/infra/migrations
  rsync -a --delete "$CHECKOUT_DIR/apps/backend/src/infra/migrations/" apps/backend/src/infra/migrations/
fi

MIGRATION_SRC_DIR="apps/backend/src/infra/migrations"
if [ -n "${CHECKOUT_DIR:-}" ] && [ -d "$CHECKOUT_DIR/apps/backend/src/infra/migrations" ]; then
  MIGRATION_SRC_DIR="$CHECKOUT_DIR/apps/backend/src/infra/migrations"
fi

if [ -d "$ARTIFACT_DIR/apps/backend/dist" ]; then
  bash "$PRUNE_SCRIPT" "$ARTIFACT_DIR/apps/backend/dist" "$MIGRATION_SRC_DIR"
fi

if [ -d apps/backend/dist ]; then
  mv apps/backend/dist "apps/backend/dist.bak.$(date +%F-%H%M)"
fi

mkdir -p apps/backend/dist
rsync -a --delete "$ARTIFACT_DIR/apps/backend/dist/" apps/backend/dist/
cp -r "$ARTIFACT_DIR/apps/backend/policies" apps/backend/policies

bash "$PRUNE_SCRIPT" apps/backend/dist "$MIGRATION_SRC_DIR"

if compgen -G "$ARTIFACT_DIR/packages/*/dist" > /dev/null; then
  for pkg in "$ARTIFACT_DIR"/packages/*/dist; do
    pkg_name="$(basename "$(dirname "$pkg")")"
    mkdir -p "packages/$pkg_name/dist"
    cp -r "$pkg"/* "packages/$pkg_name/dist/" 2>/dev/null || true
  done
fi

pnpm install --prod --frozen-lockfile
pnpm --filter @my-ai-orchestrator/backend migrate

if ! grep -q "resolveReasoningFields" "$WORKER_BUNDLE"; then
  echo "WARNING: worker bundle may be missing recent text-quality voice fixes (resolveReasoningFields not found)." >&2
fi

pm2 reload "$ECOSYSTEM_FILE" --only cultiv-api
pm2 restart "$ECOSYSTEM_FILE" --only cultiv-worker

sleep 5
curl -f http://127.0.0.1:3001/health

find apps/backend/dist.bak.* -maxdepth 0 -mtime +3 -exec rm -rf {} \; 2>/dev/null || true

echo "Deploy complete: $APP_DIR"
