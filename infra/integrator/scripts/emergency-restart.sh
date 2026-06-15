#!/usr/bin/env bash
set -euo pipefail

# =============================================================================
# Cultiv — Emergency Restart (Botão de Pânico)
# =============================================================================
# Reinicia todos os serviços em caso de emergência. Útil quando múltiplos
# componentes falharam e o sistema não está respondendo.
# =============================================================================

echo "🚨 Emergency restart initiated at $(date)"

# 1. Salvar estado PM2
pm2 save > /dev/null 2>&1 || true

# 2. Parar tudo
pm2 stop all

# 3. Reiniciar Docker containers
docker restart cultiv-postgres
docker restart cultiv-redis
sleep 5

# 4. Verificar saúde dos dados
if ! docker exec cultiv-postgres pg_isready -U cultiv > /dev/null 2>&1; then
  echo "❌ PostgreSQL failed to start"
  exit 1
fi

if ! docker exec cultiv-redis redis-cli ping > /dev/null 2>&1; then
  echo "❌ Redis failed to start"
  exit 1
fi

# 5. Migrations (se necessário)
cd /home/ubuntu/cultiv/app
pnpm --filter @my-ai-orchestrator/backend migrate 2>/dev/null || true

# 6. Iniciar PM2
pm2 start /home/ubuntu/cultiv/app/ecosystem.config.cjs

# 7. Health check
sleep 10
if curl -sf http://127.0.0.1:3001/health > /dev/null 2>&1; then
  echo "✅ Emergency restart completed at $(date)"
else
  echo "❌ Health check failed after restart"
  exit 1
fi
