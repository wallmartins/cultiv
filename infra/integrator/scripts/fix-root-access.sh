#!/usr/bin/env bash
# =============================================================================
# Cultiv — Root Access Troubleshooting Script
# =============================================================================
# Resolve o problema: "Permission denied" ao rodar apt-get como usuário sudo
# Uso: curl -sSL https://raw.githubusercontent.com/... | bash
#    OU: wget -qO- https://raw.githubusercontent.com/... | bash
# =============================================================================

set -euo pipefail

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

log() { echo -e "${GREEN}[✓]${NC} $1"; }
warn() { echo -e "${YELLOW}[!]${NC} $1"; }
err() { echo -e "${RED}[✗]${NC} $1"; }

# =============================================================================
# Diagnóstico
# =============================================================================

echo "=== Cultiv — Diagnóstico de Acesso Root ==="
echo ""
echo "Usuário atual: $(whoami)"
echo "UID: $(id -u)"
echo "Grupos: $(id -Gn)"
echo ""

# Verificar se está no grupo sudo
if id -nG | grep -qw "sudo"; then
  log "Usuário está no grupo sudo"
else
  err "Usuário NÃO está no grupo sudo"
  warn "Execute como root: usermod -aG sudo $(whoami)"
  warn "Depois FAÇA LOGOUT e LOGIN novamente na VPS"
  exit 1
fi

# Verificar se sudo está instalado
if command -v sudo &>/dev/null; then
  log "sudo está instalado"
else
  err "sudo não está instalado"
  warn "Execute como root: apt-get install -y sudo"
  exit 1
fi

# Testar sudo
if sudo -n true 2>/dev/null; then
  log "sudo funciona sem senha (ou sessão já autenticou)"
else
  warn "sudo requer senha (isso é normal)"
  echo ""
  echo "=== TESTE ==="
  echo "Vou tentar rodar 'sudo whoami'..."
  if sudo whoami | grep -q "root"; then
    log "sudo funciona! Você tem acesso root"
  else
    err "sudo falhou - senha incorreta ou problema de configuração"
    exit 1
  fi
fi

# =============================================================================
# Solução
# =============================================================================

echo ""
echo "=== SOLUÇÃO ==="
echo ""
echo "O problema é que você está rodando apt-get SEM 'sudo'."
echo ""
echo "Como seu usuário está no grupo sudo, basta usar 'sudo' antes dos comandos:"
echo ""
echo "  ❌ ERRADO: apt-get update"
echo "  ✅ CERTO:  sudo apt-get update"
echo ""
echo "  ❌ ERRADO: apt-get install -y docker.io"
echo "  ✅ CERTO:  sudo apt-get install -y docker.io"
echo ""
echo "  ❌ ERRADO: ./bootstrap-vm.sh"
echo "  ✅ CERTO:  sudo ./bootstrap-vm.sh"
echo ""
echo "=== DICAS ==="
echo ""
echo "1. Sudo pede senha na PRIMEIRA vez por sessão. Depois lembra por 15 min."
echo "2. Se disser 'cultiv is not in the sudoers file', faça logout e login novamente"
echo "3. Se quiser rodar múltiplos comandos como root, use: sudo su -"
echo "4. Para editar arquivos de sistema: sudo nano /caminho/do/arquivo"
echo ""
echo "=== COMANDO RÁPIDO ==="
echo ""
echo "Se quiser testar agora, copie e cole:"
echo ""
echo "  sudo apt-get update && sudo apt-get upgrade -y"
echo ""
log "Diagnóstico completo!"
