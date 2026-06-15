# Cultiv — Infraestrutura Integrator

Este diretório contém todos os scripts, configurações e documentação para deploy do backend Cultiv no Integrator VPS (VPS Linux Core, Brazil) com Cloudflare como edge proxy e Cloudflare R2 para backup storage.

## Estrutura

```
infra/integrator/
├── scripts/           # Scripts de automação
│   ├── bootstrap-vm.sh        # Setup inicial da VPS (Ubuntu 26.04)
│   ├── health-check.sh        # Monitoria e auto-recovery
│   ├── metrics-collector.sh   # Coleta de métricas
│   ├── backup.sh              # Backup diário para Cloudflare R2
│   ├── verify-backup.sh       # Verificação de backup
│   ├── verify-cloudflare.sh   # Verificação de config Cloudflare
│   ├── log-summary.sh         # Resumo diário de logs
│   ├── emergency-restart.sh   # Botão de pânico
│   ├── diagnose.sh            # Diagnóstico completo
│   └── go-live-check.sh      # Checklist de go-live
├── configs/           # Configurações de referência
│   ├── .env.example           # Variáveis de ambiente
│   ├── docker-compose.yml     # PostgreSQL + Redis
│   ├── nginx.conf             # Reverse proxy
│   ├── ecosystem.config.cjs   # PM2 (API + Worker)
│   └── crontab                # Configuração de cron
└── docs/             # Runbooks
    └── runbooks/
        ├── integrator-vps-provisioning.md
        ├── cloudflare-tunnel-setup.md      # Tunnel + Zero Trust SSH
        ├── cloudflare-r2-setup.md          # R2 backup storage
        ├── monitoring-alerting.md
        ├── disaster-recovery.md
        ├── graceful-shutdown.md            ✅ Implementado
        └── integrator-deploy-go-live.md
```

## Pré-requisitos

- Integrator account (VPS Linux Core, Brazil datacenter)
- Cloudflare account (free plan, DNS zone para `cultiv.app`)
- Cloudflare R2 bucket (10GB free tier)
- rclone configurado com credenciais R2
- GitHub repository (Actions enabled)
- Auth0 tenant (callback URL configurado)
- Discord server (webhook URL)

## Setup

> **Nunca fez deploy antes?** Siga o guia detalhado passo a passo: [`first-deploy-step-by-step.md`](./docs/runbooks/first-deploy-step-by-step.md)

### Phase 1: VPS Provisioning
1. **Contratar VPS** no Integrator (VPS Linux Core, Ubuntu 26.04 LTS)
2. **Acessar VPS** via SSH (console web da Integrator ou terminal)
3. **Rodar bootstrap**: `sudo ./infra/integrator/scripts/bootstrap-vm.sh`
4. **Iniciar Docker**: `docker compose up -d`

### Phase 2: Cloudflare Configuration
5. **Configurar Cloudflare Tunnel** (`cloudflared`):
   - `cloudflared tunnel login`
   - `cloudflared tunnel create cultiv-backend`
   - `cloudflared tunnel route dns cultiv-backend api.cultiv.app`
   - `cloudflared tunnel route dns cultiv-backend ssh.cultiv.app`
   - `cloudflared service install`
   - Detalhes: [`cloudflare-tunnel-setup.md`](./docs/runbooks/cloudflare-tunnel-setup.md)
6. **Configurar Cloudflare R2**:
   - Criar bucket `cultiv-backups` no Cloudflare dashboard
   - Gerar API token (Object Read & Write)
   - Configurar `rclone`: `rclone config`
   - Detalhes: [`cloudflare-r2-setup.md`](./docs/runbooks/cloudflare-r2-setup.md)
7. **Configurar Zero Trust SSH**:
   - Cloudflare dashboard → Zero Trust → Access → Applications
   - Adicionar `ssh.cultiv.app` com política de acesso
   - Detalhes: [`cloudflare-tunnel-setup.md`](./docs/runbooks/cloudflare-tunnel-setup.md)

### Phase 3: Application Deployment
8. **Configurar `.env`** com secrets (incluindo R2 credentials, Auth0, AI providers)
9. **Deployar aplicação**: push para `main` ou deploy manual
10. **Verificar configuração**: `./scripts/verify-cloudflare.sh`

### Guia Detalhado para Iniciantes
- **Primeiro deploy completo:** [`first-deploy-step-by-step.md`](./docs/runbooks/first-deploy-step-by-step.md)
- **Inclui:** Comandos exatos, troubleshooting, checklist

## Cron (Automatização)

```bash
# Health check a cada 2 minutos
*/2 * * * * /home/ubuntu/cultiv/scripts/health-check.sh

# Métricas a cada 1 minuto
* * * * * /home/ubuntu/cultiv/scripts/metrics-collector.sh

# Backup diário às 03:00
0 3 * * * /home/ubuntu/cultiv/scripts/backup.sh

# Verificação de backup semanal (domingo)
0 4 * * 0 /home/ubuntu/cultiv/scripts/verify-backup.sh

# Resumo de logs diário às 08:00
0 8 * * * /home/ubuntu/cultiv/scripts/log-summary.sh
```

## Comandos úteis

| Comando | Descrição |
|---------|-----------|
| `status` | PM2 + Docker status |
| `logs-api` | Logs do API em tempo real |
| `logs-worker` | Logs do Worker em tempo real |
| `logs-err` | Logs de erro |
| `metrics` | Métricas JSON |
| `diagnose` | Relatório completo |
| `emergency` | Restart de emergência |

## Custo

- **Integrator VPS:** R$ 39.90/month (VPS Linux Core, monthly plan — no contract)
- **Cloudflare R2:** ~$0-0.15/month (dentro do free tier de 10GB)
- **Cloudflare:** $0 (Free plan)
- **Vercel:** $0 (Free tier)
- **UptimeRobot:** $0 (Free tier)
- **Discord:** $0 (Webhook)

## Segurança

- Zero inbound ports expostos
- SSH via Cloudflare Zero Trust (não exposto na internet)
- Cloudflare WAF (DDoS, bots, rate limiting)
- SSL termination no edge
- PostgreSQL e Redis bind local apenas

## Issues relacionadas

- [58-65: Integrator + Cloudflare Deploy](../../docs/live/issues/README.md#integrator-cloudflare-deploy)
