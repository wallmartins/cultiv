#!/usr/bin/env bash
# Materializa as transições lazy de billing (trialing/canceled -> lapsed) na coluna
# billing_subscriptions.status e dispara os avisos de fim de janela (ADR 0006).
#
# O gate de geração NÃO depende deste sweep — a leitura da entitlement já deriva o
# status efetivo no lazy-clock; isto só mantém a coluna coerente (relatórios/admin)
# e faz o hook onLapse rodar. Meant to run via cron (ver infra/integrator/configs/crontab).
#
# Path-relativo de propósito: funciona seja o app em /home/cultiv/app ou /home/cultiv/cultiv.
# Requer DATABASE_URL no ambiente (carregado do .env da raiz do app, se existir) e o
# backend compilado (apps/backend/dist/cli/billing-lifecycle-sweep.js).
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
APP_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
cd "$APP_ROOT"

if [ -f .env ]; then
  set -a
  # shellcheck disable=SC1091
  . ./.env
  set +a
fi

exec node apps/backend/dist/cli/billing-lifecycle-sweep.js
