#!/usr/bin/env bash
set -euo pipefail

# =============================================================================
# Cultiv — VPS Bootstrap Script
# =============================================================================
# Este script prepara uma VPS Ubuntu 26.04 LTS (Integrator, Hetzner, etc.) para hospedar
# o backend Cultiv (PostgreSQL, Redis, Node.js, PM2, Nginx, cloudflared).
# 
# Uso: sudo CULTIV_USER=cultiv ./bootstrap-vm.sh
# Requer: Ubuntu 26.04 LTS, acesso root, conexão com internet
# =============================================================================

# Usuário que vai rodar o projeto (pode ser ubuntu, cultiv, etc.)
CULTIV_USER="${CULTIV_USER:-ubuntu}"
CULTIV_ROOT="/home/${CULTIV_USER}/cultiv"
CULTIV_APP="${CULTIV_ROOT}/app"
CULTIV_DATA="${CULTIV_ROOT}/data"
CULTIV_LOGS="${CULTIV_ROOT}/logs"
CULTIV_METRICS="${CULTIV_ROOT}/metrics"
CULTIV_SCRIPTS="${CULTIV_ROOT}/scripts"
CULTIV_BACKUPS="${CULTIV_ROOT}/backups"

log() {
  echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1"
}

# =============================================================================
# 1. Atualização do sistema
# =============================================================================
log "Atualizando sistema..."
export DEBIAN_FRONTEND=noninteractive
apt-get update -y
apt-get upgrade -y
apt-get install -y \
  curl \
  wget \
  git \
  jq \
  bc \
  rsync \
  logrotate \
  ufw \
  unattended-upgrades \
  apt-listchanges \
  software-properties-common \
  gnupg \
  lsb-release \
  ca-certificates

# =============================================================================
# 2. Docker
# =============================================================================
log "Instalando Docker..."
if ! command -v docker &> /dev/null; then
  curl -fsSL https://download.docker.com/linux/ubuntu/gpg | gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg
  # Ubuntu 26.04 pode usar codename 'noble' ou um novo. Se o repositório não existir, fallback para 'noble'.
  UBUNTU_CODENAME=$(lsb_release -cs)
  if ! curl -s "https://download.docker.com/linux/ubuntu/dists/${UBUNTU_CODENAME}/" | grep -q "stable"; then
    log "Docker repository for ${UBUNTU_CODENAME} not found, using noble as fallback..."
    UBUNTU_CODENAME="noble"
  fi
  echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/ubuntu ${UBUNTU_CODENAME} stable" > /etc/apt/sources.list.d/docker.list
  apt-get update -y
  apt-get install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin
fi

  usermod -aG docker "${CULTIV_USER}"
systemctl enable docker
systemctl start docker

# =============================================================================
# 3. Node.js 22 + pnpm + PM2
# =============================================================================
log "Instalando Node.js 22..."
if ! command -v node &> /dev/null || [[ "$(node --version)" != "v22"* ]]; then
  curl -fsSL https://deb.nodesource.com/setup_22.x | bash -
  apt-get install -y nodejs
fi

log "Instalando pnpm e PM2..."
npm install -g pnpm@11.3.0
npm install -g pm2

# =============================================================================
# 4. Nginx
# =============================================================================
log "Instalando Nginx..."
apt-get install -y nginx
systemctl enable nginx

# =============================================================================
# 5. Cloudflared (Cloudflare Tunnel)
# =============================================================================
log "Instalando cloudflared..."
if ! command -v cloudflared &> /dev/null; then
  # Detectar arquitetura (Integrator VPS Linux Core = AMD EPYC = amd64)
  ARCH=$(dpkg --print-architecture)
  wget -q "https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-${ARCH}.deb" -O /tmp/cloudflared.deb
  dpkg -i /tmp/cloudflared.deb || apt-get install -f -y
  rm -f /tmp/cloudflared.deb
fi

# =============================================================================
# 6. rclone (para backups no Cloudflare R2)
# =============================================================================
log "Instalando rclone..."
if ! command -v rclone &> /dev/null; then
  curl -fsSL https://rclone.org/install.sh | bash
fi

# =============================================================================
# 7. Segurança: UFW (sem fail2ban — SSH não exposto)
# =============================================================================
log "Configurando UFW..."
ufw default deny incoming
ufw default allow outgoing
# Não abrimos nenhuma porta — Cloudflare Tunnel é outbound
# SSH será acessado via Cloudflare Zero Trust
ufw --force enable

log "Configurando unattended-upgrades..."
cat > /etc/apt/apt.conf.d/50unattended-upgrades <<'EOF'
Unattended-Upgrade::Allowed-Origins {
  "${distro_id}:${distro_codename}-security";
};
Unattended-Upgrade::AutoFixInterruptedDpkg "true";
Unattended-Upgrade::MinimalSteps "true";
Unattended-Upgrade::InstallOnShutdown "false";
Unattended-Upgrade::Mail "";
Unattended-Upgrade::Remove-Unused-Dependencies "true";
Unattended-Upgrade::Remove-New-Unused-Dependencies "true";
EOF

# =============================================================================
# 8. Estrutura de diretórios
# =============================================================================
log "Criando estrutura de diretórios..."
mkdir -p \
  "${CULTIV_APP}" \
  "${CULTIV_DATA}/postgres" \
  "${CULTIV_DATA}/redis" \
  "${CULTIV_DATA}/backups" \
  "${CULTIV_LOGS}" \
  "${CULTIV_METRICS}" \
  "${CULTIV_SCRIPTS}" \
  "${CULTIV_ROOT}/docs/runbooks"

  chown -R "${CULTIV_USER}:${CULTIV_USER}" "${CULTIV_ROOT}"

# =============================================================================
# 9. logrotate
# =============================================================================
log "Configurando logrotate..."
cat > /etc/logrotate.d/cultiv <<EOF
${CULTIV_LOGS}/*.log {
    daily
    rotate 14
    compress
    delaycompress
    missingok
    notifempty
    create 0644 ubuntu ubuntu
    dateext
    dateformat -%Y%m%d-%s
    size 100M
}

/home/${CULTIV_USER}/.pm2/logs/*.log {
    daily
    rotate 7
    compress
    delaycompress
    missingok
    notifempty
    copytruncate
    create 0644 ${CULTIV_USER} ${CULTIV_USER}
}
EOF

# =============================================================================
# 10. Nginx config
# =============================================================================
log "Configurando Nginx..."
cat > /etc/nginx/sites-available/cultiv <<'EOF'
server {
    listen 127.0.0.1:80;
    server_name localhost;

    real_ip_header CF-Connecting-IP;
    set_real_ip_from 127.0.0.1;

    location / {
        proxy_pass http://127.0.0.1:3001;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header CF-Connecting-IP $http_cf_connecting_ip;
        proxy_read_timeout 300s;
        proxy_connect_timeout 75s;
    }

    location /health {
        proxy_pass http://127.0.0.1:3001/health;
        access_log off;
    }

    location /metrics {
        alias ${CULTIV_ROOT}/metrics/current.json;
        add_header Content-Type application/json;
        access_log off;
    }
}
EOF

rm -f /etc/nginx/sites-enabled/default
ln -sf /etc/nginx/sites-available/cultiv /etc/nginx/sites-enabled/cultiv
nginx -t && systemctl reload nginx

# =============================================================================
# 11. Docker Compose
# =============================================================================
log "Criando docker-compose.yml..."
cat > "${CULTIV_ROOT}/docker-compose.yml" <<'EOF'
services:
  postgres:
    image: postgres:16-alpine
    container_name: cultiv-postgres
    environment:
      POSTGRES_USER: cultiv
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD:-changeme}
      POSTGRES_DB: cultiv
    volumes:
      - ${CULTIV_ROOT}/data/postgres:/var/lib/postgresql/data
    ports:
      - "127.0.0.1:5432:5432"
    restart: unless-stopped
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U cultiv -d cultiv"]
      interval: 10s
      timeout: 5s
      retries: 5

  redis:
    image: redis:7-alpine
    container_name: cultiv-redis
    command: redis-server --appendonly yes
    volumes:
      - ${CULTIV_ROOT}/data/redis:/data
    ports:
      - "127.0.0.1:6379:6379"
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 10s
      timeout: 5s
      retries: 5

volumes:
  postgres_data:
  redis_data:
EOF

# =============================================================================
# 12. PM2 ecosystem (template)
# =============================================================================
log "Criando ecosystem.config.cjs template..."
cat > "${CULTIV_APP}/ecosystem.config.cjs" <<'EOF'
module.exports = {
  apps: [
    {
      name: 'cultiv-api',
      script: '${CULTIV_ROOT}/app/apps/backend/dist/cli/main.js',
      cwd: '${CULTIV_ROOT}/app',
      instances: 1,
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'production',
        HOST: '127.0.0.1',
        PORT: 3001,
        SERVICE_NAME: 'cultiv-api',
        APP_VERSION: '0.1.0',
        EXECUTION_MODE: 'async',
        QUALITY_MODE: 'balanced',
        DEFAULT_LANGUAGE: 'pt-BR',
        BACKEND_TRUST_PROXY: 'true',
        OUTBOX_RELAY_INTERVAL_MS: '1000',
        RATE_LIMIT_MAX_REQUESTS: '60',
        RATE_LIMIT_WINDOW_MS: '60000'
      },
      log_file: '${CULTIV_ROOT}/logs/api-combined.log',
      out_file: '${CULTIV_ROOT}/logs/api-out.log',
      err_file: '${CULTIV_ROOT}/logs/api-err.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,
      max_memory_restart: '512M',
      restart_delay: 3000,
      kill_timeout: 5000,
      listen_timeout: 10000,
      wait_ready: true
    },
    {
      name: 'cultiv-worker',
      script: '${CULTIV_ROOT}/app/apps/backend/dist/cli/worker-main.js',
      cwd: '${CULTIV_ROOT}/app',
      instances: 1,
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'production',
        EXECUTION_WORKER_CONCURRENCY: '2'
      },
      log_file: '${CULTIV_ROOT}/logs/worker-combined.log',
      out_file: '${CULTIV_ROOT}/logs/worker-out.log',
      err_file: '${CULTIV_ROOT}/logs/worker-err.log',
      max_memory_restart: '512M',
      restart_delay: 3000,
      kill_timeout: 5000
    }
  ]
};
EOF

chown -R "${CULTIV_USER}:${CULTIV_USER}" "${CULTIV_APP}"

# =============================================================================
# 13. Aliases úteis
# =============================================================================
log "Criando aliases..."
cat >> /home/${CULTIV_USER}/.bashrc <<EOF

# Cultiv aliases
alias logs-api='tail -f ${CULTIV_ROOT}/logs/api-out.log'
alias logs-api-err='tail -f ${CULTIV_ROOT}/logs/api-err.log'
alias logs-worker='tail -f ${CULTIV_ROOT}/logs/worker-out.log'
alias logs-worker-err='tail -f ${CULTIV_ROOT}/logs/worker-err.log'
alias logs-health='tail -f ${CULTIV_ROOT}/logs/health-check.log'
alias logs-backup='tail -f ${CULTIV_ROOT}/logs/backup.log'
alias logs-pm2='pm2 logs'
alias status='pm2 status && docker ps'
alias metrics='cat ${CULTIV_ROOT}/metrics/current.json'
EOF

chown "${CULTIV_USER}:${CULTIV_USER}" /home/${CULTIV_USER}/.bashrc

# =============================================================================
# 14. Verificações finais
# =============================================================================
log "Verificações finais..."
echo ""
echo "========================================"
echo "  Bootstrap concluído!"
echo "========================================"
echo ""
echo "  Docker:     $(docker --version 2>/dev/null || echo 'N/A')"
echo "  Node:       $(node --version 2>/dev/null || echo 'N/A')"
echo "  pnpm:       $(pnpm --version 2>/dev/null || echo 'N/A')"
echo "  PM2:        $(pm2 --version 2>/dev/null || echo 'N/A')"
echo "  Nginx:      $(nginx -v 2>&1 | head -1 || echo 'N/A')"
echo "  cloudflared: $(cloudflared --version 2>/dev/null | head -1 || echo 'N/A')"
echo "  rclone:     $(rclone --version 2>/dev/null | head -1 || echo 'N/A')"
echo ""
echo "  Próximos passos:"
echo "  1. Configurar Cloudflare Tunnel: cloudflared tunnel login"
echo "  2. Configurar Cloudflare Zero Trust SSH"
echo "  3. Criar .env com secrets"
echo "  4. Iniciar PostgreSQL + Redis: docker compose up -d"
echo "  5. Deployar aplicação"
echo ""
echo "  Diretório: ${CULTIV_ROOT}"
echo "========================================"
