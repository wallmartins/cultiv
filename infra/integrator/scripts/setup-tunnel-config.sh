#!/usr/bin/env bash
set -euo pipefail

# =============================================================================
# Cultiv — Setup Cloudflare Tunnel Config
# =============================================================================
# Cria ~/.cloudflared/config.yml com o tunnel ID fornecido.
#
# Uso: ./setup-tunnel-config.sh <tunnel-id>
# Ex:  ./setup-tunnel-config.sh fee1e25e-086f-4ff1-b17d-a75925d74ffc
#
# Requer: cloudflared instalado e autenticado (cloudflared tunnel login)
# =============================================================================

TUNNEL_ID="${1:-}"

if [ -z "$TUNNEL_ID" ]; then
  echo "Erro: informe o tunnel ID."
  echo "Uso: $0 <tunnel-id>"
  echo "Ex:  $0 fee1e25e-086f-4ff1-b17d-a75925d74ffc"
  exit 1
fi

CONFIG_DIR="$HOME/.cloudflared"
CONFIG_FILE="${CONFIG_DIR}/config.yml"

mkdir -p "$CONFIG_DIR"

cat > "$CONFIG_FILE" <<EOF
tunnel: ${TUNNEL_ID}
credentials-file: ${CONFIG_DIR}/${TUNNEL_ID}.json

ingress:
  - hostname: api.cultiv.app
    service: http://127.0.0.1:80
  - hostname: ssh.cultiv.app
    service: ssh://127.0.0.1:22
  - service: http_status:404
EOF

echo "✓ config.yml criado em ${CONFIG_FILE}"
