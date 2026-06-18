#!/usr/bin/env bash
set -euo pipefail

# Remove compiled migration bundles that no longer have a matching TypeScript source file.
#
# Usage:
#   prune-stale-migration-bundles.sh <dist-dir> <src-migrations-dir>

DIST_DIR="${1:?dist dir required}"
SRC_DIR="${2:?src migrations dir required}"
MIGRATIONS_DIR="$DIST_DIR/infra/migrations"

if [ ! -d "$MIGRATIONS_DIR" ]; then
  exit 0
fi

shopt -s nullglob
for bundle in "$MIGRATIONS_DIR"/*.js; do
  [ -e "$bundle" ] || continue
  case "$bundle" in
    *.js.map) continue ;;
  esac

  migration_name="$(basename "$bundle" .js)"
  if [ ! -f "$SRC_DIR/$migration_name.ts" ]; then
    echo "Removing stale migration bundle: $migration_name.js"
    rm -f "$bundle" "$MIGRATIONS_DIR/$migration_name.js.map"
  fi
done
