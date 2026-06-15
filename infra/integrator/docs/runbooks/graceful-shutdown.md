# Graceful Shutdown

## Context

O backend Cultiv precisa desligar de forma limpa quando recebe SIGTERM (ex: deploy do PM2) ou SIGINT (Ctrl+C). Isso evita:
- Conexões PostgreSQL zumbis
- Jobs interrompidos no meio da execução
- Requests HTTP dropados abruptamente
- Perda de eventos do outbox

## Como funciona

### API (`main.ts`)

1. Recebe SIGTERM/SIGINT
2. Chama `server.close()` — para de aceitar novas conexões HTTP
3. Chama `runtime.stop()` — para o outbox relay e fecha a BullMQ queue
4. Timeout de 10 segundos — se não terminar, força exit
5. Log: "SIGTERM received..." → "Graceful shutdown complete"

### Worker (`worker-main.ts`)

1. Recebe SIGTERM/SIGINT
2. Chama `worker.close()` — espera o job atual terminar
3. Chama `runtime.stop()` — fecha queue
4. Timeout de 15 segundos — se não terminar, força exit
5. Log: "SIGTERM received..." → "Worker shutdown complete"

## PM2 kill_timeout

No `ecosystem.config.cjs`:
- API: `kill_timeout: 5000` (5 segundos)
- Worker: `kill_timeout: 5000` (5 segundos)

PM2 envia SIGTERM, espera 5s, depois envia SIGKILL se o processo ainda estiver rodando.

## O que acontece se falhar

- Se o worker estiver no meio de um job longo (30-60s de LLM call), SIGKILL interrompe.
- O job é durável no PostgreSQL — BullMQ vai retry automaticamente.
- Não há duplicação de créditos (idempotência).

## Como testar

```bash
# Testar API
pm2 reload cultiv-api
# Verificar logs: pm2 logs cultiv-api
# Deve ver: "SIGTERM received..." → "Graceful shutdown complete"

# Testar Worker
pm2 restart cultiv-worker
# Verificar logs: pm2 logs cultiv-worker
# Deve ver: "SIGTERM received..." → "Worker shutdown complete"

# Verificar conexões PostgreSQL (não deve aumentar)
docker exec cultiv-postgres psql -U cultiv -c "SELECT count(*) FROM pg_stat_activity;"

# Verificar conexões Redis (não deve aumentar)
docker exec cultiv-redis redis-cli CLIENT LIST | wc -l
```

## Arquivos modificados

- `apps/backend/src/cli/main.ts`
- `apps/backend/src/cli/worker-main.ts`
- `apps/backend/src/app/bootstrap.ts`
- `apps/backend/src/app/app.ts`

## Configuração

- `kill_timeout` no `ecosystem.config.cjs` (infra/integrator/configs/)
