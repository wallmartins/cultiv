# Guia Passo a Passo — Deploy Inicial na VPS Integrator

> **Nível:** Iniciante (não é necessário conhecimento prévio de Linux/Infraestrutura)  
> **Tempo estimado:** 45 minutos  
> **O que você vai fazer:** Colocar o Cultiv para rodar na VPS pela primeira vez

---

## O que você precisa ter antes de começar


| Item                     | Onde conseguir                                     | Status                            |
| ------------------------ | -------------------------------------------------- | --------------------------------- |
| VPS Integrator ativa     | Painel da Integrator                               | ✅ (já provisionou)                |
| Senha root da VPS        | Email da Integrator ou painel                      | ⬜ Verifique seu email             |
| Cloudflare account       | [dash.cloudflare.com](https://dash.cloudflare.com) | ⬜ Criar/verificar                 |
| Domínio `cultiv.app`     | Cloudflare (DNS)                                   | ⬜ Verificar se está no Cloudflare |
| Auth0 tenant configurado | [manage.auth0.com](https://manage.auth0.com)       | ⬜ Verificar callback URL          |
| Projeto no GitHub        | `github.com/seu-usuario/content-lib`               | ✅ Já existe                       |


---

## Phase 1: Acessar a VPS (Terminal)

### Step 1.1: Abrir o terminal da VPS

A Integrator te enviou um email com **IP**, **usuário** (provavelmente `root` ou `ubuntu`), e **senha**.

**Opção A — Terminal nativo (Linux/Mac):**

```bash
# Substitua 123.456.789.0 pelo IP da sua VPS
ssh root@123.456.789.0

# Se perguntar "Are you sure you want to continue?", digite: yes
# Digite a senha quando pedir (não aparece nada ao digitar — é normal)
```

**Opção B — Windows (PowerShell):**

```powershell
# PowerShell já tem SSH embutido
ssh root@123.456.789.0
# Senha quando pedir
```

**Opção C — Windows (PuTTY):**

1. Baixe [PuTTY](https://www.putty.org)
2. Host Name: `123.456.789.0`
3. Port: `22`
4. Connection type: `SSH`
5. Click **Open**
6. Login: `root`, senha: (sua senha)

**Se você ver algo assim, deu certo:**

```
root@vps-integrator:~#
```

---

## Phase 2: Atualizar o sistema e instalar o bootstrap

### Step 2.1: Atualizar o Ubuntu (dentro da VPS)

```bash
# Execute NA VPS (não no seu computador)
apt-get update && apt-get upgrade -y
```

Isso vai demorar 2-3 minutos. Quando acabar, você volta para o prompt.

### Step 2.2: Criar usuário não-root

Por segurança, não vamos rodar o projeto como `root`.

```bash
# Criar usuário (pode ser 'ubuntu', 'cultiv', ou qualquer nome)
adduser cultiv

# Vai perguntar senha e outras coisas. Escolha uma senha e aperte Enter para o resto
# Depois, adicione ao grupo sudo
usermod -aG sudo cultiv

# Teste: troque para o usuário cultiv
su - cultiv

# Se você ver algo assim, deu certo:
# cultiv@vps-integrator:~$
```

> **Nota:** Se você já criou o usuário `cultiv` e ele está no grupo sudo, pule este passo.
> O importante é: o usuário que vai rodar o projeto deve estar no grupo `sudo`.

**Saia do usuário ubuntu e volte para root:**

```bash
exit
# Você volta a ver: root@vps-integrator:~#
```

> **⚠️ Problema comum:** "Could not open lock file /var/lib/dpkg/lock-frontend — open (13: Permission denied)"
>
> **Causa:** Você está rodando `apt-get` sem `sudo`.
>
> **Solução:** Use `sudo` antes de TODOS os comandos administrativos:
> ```bash
> # ❌ ERRADO
> apt-get update
>
> # ✅ CERTO
> sudo apt-get update
> ```
>
> **Se seu usuário não está no grupo sudo:**
> ```bash
> # Execute como root:
> usermod -aG sudo cultiv   # ou seu nome de usuário
> # Depois FAÇA LOGOUT e LOGIN novamente na VPS
> ```
>
> **Se precisar de acesso root temporário:**
> ```bash
> sudo su -
> # Agora você é root até digitar 'exit'
> ```

### Step 2.3: Copiar os scripts do projeto

Agora precisamos colocar os scripts do projeto na VPS.

**Opção A — Clone do GitHub (recomendado):**

```bash
# Ainda como root
apt-get install -y git

# Criar diretório do projeto (substitua 'cultiv' pelo seu usuário)
mkdir -p /home/cultiv/cultiv

# Clone do repositório (substitua pela URL do seu repo)
git clone https://github.com/seu-usuario/content-lib.git /tmp/content-lib

# Copiar scripts para o lugar certo
cp -r /tmp/content-lib/infra/integrator/scripts/* /home/cultiv/cultiv/scripts/
cp -r /tmp/content-lib/infra/integrator/configs/* /home/cultiv/cultiv/
cp -r /tmp/content-lib/infra/integrator/docs /home/cultiv/cultiv/

# Ajustar permissões (substitua 'cultiv' pelo seu usuário)
chown -R cultiv:cultiv /home/cultiv/cultiv
```

**Opção B — Upload via SCP (se você tem o projeto local):**

```bash
# No seu computador LOCAL (não na VPS), execute:
# Substitua 123.456.789.0 pelo IP da VPS

# Compacte os scripts
zip -r integrator-scripts.zip infra/integrator/

# Envie para a VPS
scp integrator-scripts.zip root@123.456.789.0:/tmp/

# Depois, na VPS, descompacte:
# ssh root@123.456.789.0
# cd /tmp && unzip integrator-scripts.zip
# mkdir -p /home/cultiv/cultiv/scripts /home/cultiv/cultiv/configs /home/cultiv/cultiv/docs
# cp -r infra/integrator/scripts/* /home/cultiv/cultiv/scripts/
# cp -r infra/integrator/configs/* /home/cultiv/cultiv/
# cp -r infra/integrator/docs/* /home/cultiv/cultiv/docs/
# chown -R cultiv:cultiv /home/cultiv/cultiv
```

---

## Phase 3: Rodar o Bootstrap Script

### Step 3.1: Executar o bootstrap

```bash
# Como root, na VPS
chmod +x /home/cultiv/cultiv/scripts/bootstrap-vm.sh

# Se seu usuário for 'cultiv' (ao invés de 'ubuntu'):
CULTIV_USER=cultiv sudo -E /home/cultiv/cultiv/scripts/bootstrap-vm.sh

# Se seu usuário for 'ubuntu' (padrão):
sudo /home/ubuntu/cultiv/scripts/bootstrap-vm.sh
```

**Isso vai instalar:**

- Docker (PostgreSQL + Redis)
- Node.js 22
- pnpm (gerenciador de pacotes)
- PM2 (gerenciador de processos)
- Nginx (proxy reverso)
- cloudflared (Cloudflare Tunnel)
- rclone (backup R2)
- UFW (firewall)
- logrotate (rotação de logs)

**Isso leva 5-10 minutos.** Quando acabar, você verá:

```
========================================
  Bootstrap concluído!
========================================
  Docker:     Docker version 26.x...
  Node:       v22.x...
  pnpm:       11.3.0
  PM2:        5.x...
  Nginx:      nginx version: nginx/1.x...
  cloudflared: cloudflared version 2026.x...
  rclone:     rclone v1.x...
========================================
```

### Step 3.2: Verificar Docker

```bash
# Testar se Docker funciona
docker run hello-world

# Se ver "Hello from Docker!", deu certo
```

---

## Phase 4: Configurar Cloudflare Tunnel

### Step 4.1: Autenticar cloudflared

```bash
# Mude para o usuário ubuntu
su - ubuntu

# Autenticar com Cloudflare
cloudflared tunnel login
```

**Isso vai:**

1. Mostrar uma URL no terminal
2. Copie a URL e abra no seu navegador
3. Faça login com sua conta Cloudflare
4. Selecione o domínio `cultiv.app`
5. Clique em "Authorize"

**De volta ao terminal, você verá:**

```
Tunnel credentials written to /home/ubuntu/.cloudflared/cert.pem
```

### Step 4.2: Criar o tunnel

```bash
# Criar tunnel com nome "cultiv-backend"
cloudflared tunnel create cultiv-backend
```

**Anote o Tunnel ID** (algo como `12345678-abcd-1234-5678-1234567890ab`).

```
Tunnel credentials written to /home/ubuntu/.cloudflared/12345678-abcd-....json
Tunnel ID: 12345678-abcd-1234-5678-1234567890ab
```

### Step 4.3: Criar o arquivo de configuração

```bash
# Criar o arquivo de config
# SUBSTITUA <tunnel-id> pelo ID anotado acima

cat > ~/.cloudflared/config.yml <<EOF
tunnel: <tunnel-id>
credentials-file: /home/ubuntu/.cloudflared/<tunnel-id>.json

ingress:
  - hostname: api.cultiv.app
    service: http://127.0.0.1:80
  - hostname: ssh.cultiv.app
    service: ssh://127.0.0.1:22
  - service: http_status:404
EOF
```

**Exemplo real (com seu ID):**

```bash
cat > ~/.cloudflared/config.yml <<EOF
tunnel: 12345678-abcd-1234-5678-1234567890ab
credentials-file: /home/ubuntu/.cloudflared/12345678-abcd-1234-5678-1234567890ab.json

ingress:
  - hostname: api.cultiv.app
    service: http://127.0.0.1:80
  - hostname: ssh.cultiv.app
    service: ssh://127.0.0.1:22
  - service: http_status:404
EOF
```

### Step 4.4: Criar os DNS records

```bash
# Rotear DNS para o tunnel
cloudflared tunnel route dns cultiv-backend api.cultiv.app
cloudflared tunnel route dns cultiv-backend ssh.cultiv.app
```

**Isso automaticamente cria** CNAMEs no Cloudflare DNS:

- `api.cultiv.app` → `12345678-abcd-1234-5678-1234567890ab.cfargotunnel.com`
- `ssh.cultiv.app` → `12345678-abcd-1234-5678-1234567890ab.cfargotunnel.com`

### Step 4.5: Instalar como serviço

```bash
# Instalar serviço systemd
cloudflared service install

# Iniciar serviço
sudo systemctl enable cloudflared
sudo systemctl start cloudflared

# Verificar status
sudo systemctl status cloudflared
```

**Se estiver `active (running)`, deu certo!** Aperte `q` para sair do status.

---

## Phase 5: Configurar Cloudflare R2 (Backups)

### Step 5.1: Criar bucket no Cloudflare dashboard

1. Abra [dash.cloudflare.com](https://dash.cloudflare.com) no navegador
2. Selecione sua conta
3. No menu lateral, clique em **R2 Object Storage**
4. Click **Create bucket**
5. Name: `cultiv-backups`
6. Click **Create bucket**

### Step 5.2: Criar API token

1. No R2, click **Manage R2 API Tokens**
2. Click **Create API token**
3. Name: `cultiv-backup-token`
4. Permissions: **Object Read & Write**
5. TTL: **Forever** (ou escolha uma data)
6. Click **Create API Token**

**Anote:**

- Access Key ID: `xxxxxxxxxxxxxxxxxxxxxxxx`
- Secret Access Key: `yyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyy`
- Endpoint: `https://<account-id>.r2.cloudflarestorage.com`

**⚠️ IMPORTANTE:** Esses valores são mostrados apenas uma vez. Anote em um lugar seguro.

### Step 5.3: Configurar rclone na VPS

```bash
# Na VPS, como usuário ubuntu
rclone config
```

**Responda interativamente:**

```
No remotes found - make a new one
n) New remote
s) Set configuration password
q) Quit config
n/s/q> n                                 # Digite: n

name> r2                                # Digite: r2

Choose a number from below or type in your own value
 1 / 1Fichier
   \ "fichier"
 2 / Alias for an existing remote
   \ "alias"
... (muitas opções)

Choose a number from below or type in your own value
 ** See all sections by removing the filter "s3" **
XX / Amazon S3 Compliant Storage Providers
   \ (s3)

Choose a number from below or type in your own value
XX / Cloudflare R2
   \ (Cloudflare)

Provider> Cloudflare                    # Digite: Cloudflare

env_auth>                               # Aperte Enter (false)

access_key_id> xxxxxxxxxxxxxxxxxxxxxxxx   # Cole seu Access Key ID

secret_access_key> yyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyy  # Cole seu Secret

endpoint> https://<account>.r2.cloudflarestorage.com  # Cole seu Endpoint

acl> private                            # Digite: private

Edit advanced config? y) Yes n) No
y/n> n                                  # Digite: n

Keep this "r2" remote?
y) Yes this is OK
e) Edit this remote
d) Delete this remote
y/e/d> y                                # Digite: y

q) Quit config
q) Quit config
q> q                                    # Digite: q
```

### Step 5.4: Testar rclone

```bash
# Listar bucket
rclone lsd r2:

# Deve mostrar:           [     0] cultiv-backups

# Testar upload
echo "backup test" > /tmp/test.txt
rclone copy /tmp/test.txt r2:cultiv-backups/

# Listar arquivo
rclone ls r2:cultiv-backups/
# Deve mostrar: test.txt

# Deletar teste
rclone delete r2:cultiv-backups/test.txt
```

---

## Phase 6: Configurar o Ambiente (.env)

### Step 6.1: Criar o diretório da aplicação

```bash
# Na VPS, como usuário ubuntu
mkdir -p /home/ubuntu/cultiv/app
cd /home/ubuntu/cultiv/app
```

### Step 6.2: Copiar o projeto do GitHub

```bash
# Clone do repositório (use a URL do seu repo)
git clone https://github.com/seu-usuario/content-lib.git .

# Ou se você já tem o código local, pode usar SCP
# No seu computador local:
# scp -r /caminho/do/seu/projeto/* ubuntu@123.456.789.0:/home/ubuntu/cultiv/app/
```

### Step 6.3: Criar o arquivo .env

```bash
# Copiar o template
cp /home/ubuntu/cultiv/configs/.env.example /home/ubuntu/cultiv/app/.env

# Editar o .env
nano /home/ubuntu/cultiv/app/.env
```

**No nano, você precisa preencher (pelo menos esses):**

```
# Database (senha que você quer para o PostgreSQL)
POSTGRES_PASSWORD=uma-senha-forte-aqui
DATABASE_URL=postgresql://cultiv:uma-senha-forte-aqui@127.0.0.1:5432/cultiv

# Auth0 (valores do seu tenant)
AUTH_ISSUER_URL=https://seu-tenant.us.auth0.com/
AUTH_AUDIENCE=https://api.cultiv.app
AUTH_JWKS_URL=https://seu-tenant.us.auth0.com/.well-known/jwks.json

# AI Providers (suas chaves)
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...
GEMINI_API_KEY=...
DEEPSEEK_API_KEY=sk-...

# R2 (valores anotados no passo 5.2)
R2_BUCKET_NAME=cultiv-backups
R2_ENDPOINT=https://<account>.r2.cloudflarestorage.com
R2_ACCESS_KEY_ID=xxxxxxxxxxxxxxxxxxxxxxxx
R2_SECRET_ACCESS_KEY=yyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyy

# Discord webhook (para alertas)
DISCORD_WEBHOOK_URL=https://discord.com/api/webhooks/...

# Segurança
VOICE_DATA_PROTECTION_KEY=uma-chave-de-32-caracteres-aqui
CORS_ALLOWED_ORIGINS=https://www.cultiv.app,https://cultiv.app
```

**Salvar no nano:** `Ctrl+O`, `Enter`, `Ctrl+X`

**Proteger o .env:**

```bash
chmod 600 /home/ubuntu/cultiv/app/.env
```

---

## Phase 7: Iniciar Banco de Dados e Redis

### Step 7.1: Iniciar Docker containers

```bash
# Na VPS, no diretório /home/ubuntu/cultiv
cd /home/ubuntu/cultiv

# Iniciar PostgreSQL + Redis
sudo docker compose up -d

# Verificar se estão rodando
sudo docker ps

# Deve mostrar:
# CONTAINER ID   IMAGE              STATUS
# xxxxxxxx       postgres:16-alpine Up
# xxxxxxxx       redis:7-alpine     Up
```

### Step 7.2: Testar conectividade

```bash
# Testar PostgreSQL
sudo docker exec cultiv-postgres pg_isready -U cultiv
# Deve retornar: /var/run/postgresql:5432 - accepting connections

# Testar Redis
sudo docker exec cultiv-redis redis-cli ping
# Deve retornar: PONG
```

---

## Phase 8: Deployar a Aplicação pela Primeira Vez

### Step 8.1: Instalar dependências e buildar

```bash
# Na VPS, no diretório /home/ubuntu/cultiv/app
cd /home/ubuntu/cultiv/app

# Instalar dependências
pnpm install --frozen-lockfile

# Buildar o backend
pnpm build:backend

# Se der erro, verifique se o .env está correto
```

### Step 8.2: Rodar migrations

```bash
# Criar as tabelas no PostgreSQL
pnpm --filter @my-ai-orchestrator/backend migrate

# Se perguntar se quer aplicar, diga sim
```

### Step 8.3: Copiar o ecosystem do PM2

```bash
# Copiar config do PM2
cp /home/ubuntu/cultiv/configs/ecosystem.config.cjs /home/ubuntu/cultiv/app/ecosystem.config.cjs
```

### Step 8.4: Iniciar com PM2

```bash
# Iniciar API e Worker
pm2 start ecosystem.config.cjs

# Verificar se estão rodando
pm2 status

# Deve mostrar:
# ┌─────┬─────────────┬─────────┬─────┬──────────┬──────┬──────────┐
# │ id  │ name        │ mode    │ pid │ status   │ restart│ uptime  │
# ├─────┼─────────────┼─────────┼─────┼──────────┼──────┼──────────┤
# │ 0   │ cultiv-api  │ fork    │ x   │ online   │ 0    │ 0s      │
# │ 1   │ cultiv-w... │ fork    │ x   │ online   │ 0    │ 0s      │
# └─────┴─────────────┴─────────┴─────┴──────────┴──────┴──────────┘
```

### Step 8.5: Verificar se a API responde

```bash
# Testar health check localmente
curl http://127.0.0.1:3001/health

# Deve retornar algo como: {"status":"ok"}

# Testar readiness
curl http://127.0.0.1:3001/ready

# Deve retornar: {"status":"ready"}
```

---

## Phase 9: Testar pelo Cloudflare (externo)

### Step 9.1: Testar via HTTPS

No seu **computador local** (não na VPS), abra o terminal:

```bash
# Testar se a API está acessível pela internet
curl https://api.cultiv.app/health

# Deve retornar: {"status":"ok"}

# Se der erro, aguarde 1-2 minutos (DNS pode estar propagando)
```

### Step 9.2: Testar no navegador

Abra no navegador: `https://api.cultiv.app/health`

Deve mostrar: `{"status":"ok"}`

Se mostrar o cadeado verde (SSL) e o JSON, **parabéns, está no ar!**

---

## Phase 10: Configurar GitHub Actions (CI/CD)

### Step 10.1: Instalar o self-hosted runner

Na VPS, como usuário ubuntu:

```bash
# Criar diretório para o runner
mkdir -p /home/ubuntu/actions-runner && cd /home/ubuntu/actions-runner

# Download do runner (substitua pela versão mais recente)
# Veja a versão mais recente em: https://github.com/actions/runner/releases
# No momento da escrita, é a versão 2.x

# Baixar
wget https://github.com/actions/runner/releases/download/v2.319.0/actions-runner-linux-x64-2.319.0.tar.gz

# Extrair
tar xzf actions-runner-linux-x64-2.319.0.tar.gz

# Configurar (GitHub vai te dar um token)
# Vá no seu repositório GitHub → Settings → Actions → Runners → New self-hosted runner
# Copie o comando de configuração (vai ter um token)
# Exemplo:
./config.sh --url https://github.com/seu-usuario/content-lib --token TOKEN_DO_GITHUB

# Quando perguntar o nome, diga: integrator
# Quando perguntar os labels, diga: self-hosted,integrator
# Quando perguntar o work folder, aperte Enter (padrão)

# Instalar como serviço
sudo ./svc.sh install
sudo ./svc.sh start
```

### Step 10.2: Verificar no GitHub

No GitHub, vá em: **Settings → Actions → Runners**

Deve aparecer um runner chamado `integrator` com status **Idle**.

---

## Phase 11: Testar o Deploy Automático

### Step 11.1: Fazer push para main

No seu **computador local**:

```bash
# Fazer uma mudança pequena (ex: adicionar espaço no README)
echo " " >> README.md
git add README.md
git commit -m "Test deploy"
git push origin main
```

### Step 11.2: Verificar no GitHub

1. GitHub → Actions → Verifique o workflow rodando
2. Deve mostrar: **Deploy to Integrator VPS**
3. Aguarde 3-5 minutos
4. Status deve ficar verde (✅)

### Step 11.3: Verificar na VPS

```bash
# Na VPS
pm2 logs cultiv-api

# Deve mostrar o deploy recente
```

---

## Phase 12: Verificação Final

### Step 12.1: Rodar o script de verificação

```bash
# Na VPS
/home/ubuntu/cultiv/scripts/verify-cloudflare.sh
```

Deve mostrar: **🎉 All Cloudflare checks passed!**

### Step 12.2: Testar backup

```bash
# Rodar backup manual
/home/ubuntu/cultiv/scripts/backup.sh

# Verificar se subiu para R2
rclone ls r2:cultiv-backups

# Deve mostrar arquivos: db-2026-...sql.gz
```

### Step 12.3: Testar health check

```bash
# Verificar se o health check está rodando
sudo tail -f /home/ubuntu/cultiv/logs/health-check.log

# Deve mostrar checagens a cada 2 minutos
```

---

## Troubleshooting (Problemas comuns)

### Problema: `cloudflared` não conecta

```bash
# Verificar logs
sudo journalctl -u cloudflared -f

# Se falar de certificado, re-autentique:
cloudflared tunnel login

# Se falar de tunnel não encontrado, verifique o ID:
cloudflared tunnel list
```

### Problema: `curl https://api.cultiv.app` não funciona

```bash
# 1. Verifique se o tunnel está ativo
sudo systemctl status cloudflared

# 2. Verifique se DNS está criado
# No Cloudflare dashboard → DNS, deve ter CNAME para api.cultiv.app

# 3. Verifique se Nginx está ouvindo
sudo nginx -t
sudo systemctl status nginx

# 4. Verifique se a API está rodando
curl http://127.0.0.1:3001/health
# Se funcionar localmente, o problema é no tunnel
```

### Problema: PostgreSQL não conecta

```bash
# Verificar se o container está rodando
sudo docker ps

# Se não estiver, iniciar
sudo docker compose up -d

# Verificar logs
sudo docker logs cultiv-postgres
```

### Problema: PM2 não inicia

```bash
# Ver logs
pm2 logs

# Se falar de "module not found", provavelmente não buildou
pnpm build:backend

# Se falar de "env", verifique se o .env existe
ls -la /home/ubuntu/cultiv/app/.env
```

### Problema: rclone não conecta ao R2

```bash
# Verificar config
rclone config show

# Testar listar
rclone lsd r2:

# Se der erro, reconfigure:
rclone config
# Delete o remote r2 e crie novamente
```

---

## Checklist Final


| #   | Check                                  | Status |
| --- | -------------------------------------- | ------ |
| 1   | VPS acessível via SSH                  | ⬜      |
| 2   | Bootstrap rodou sem erros              | ⬜      |
| 3   | Docker rodando (PostgreSQL + Redis)    | ⬜      |
| 4   | Cloudflare Tunnel conectado            | ⬜      |
| 5   | `api.cultiv.app` responde via HTTPS    | ⬜      |
| 6   | `ssh.cultiv.app` funciona (Zero Trust) | ⬜      |
| 7   | R2 bucket criado e rclone conectado    | ⬜      |
| 8   | `.env` configurado com todas as chaves | ⬜      |
| 9   | Aplicação buildou sem erros            | ⬜      |
| 10  | Migrations aplicadas                   | ⬜      |
| 11  | PM2 rodando (API + Worker)             | ⬜      |
| 12  | Health check local funciona            | ⬜      |
| 13  | Health check externo funciona (HTTPS)  | ⬜      |
| 14  | GitHub Actions runner registrado       | ⬜      |
| 15  | Deploy automático funciona             | ⬜      |
| 16  | Backup para R2 funciona                | ⬜      |
| 17  | `verify-cloudflare.sh` passa           | ⬜      |
| 18  | Zero ports expostos (`nmap` no IP)     | ⬜      |


---

## Próximos Passos

Após completar este guia:

1. **Configure o Auth0 callback URL** para `https://api.cultiv.app`
2. **Configure o frontend (Vercel)** para apontar API para `https://api.cultiv.app`
3. **Teste uma geração real** pelo frontend
4. **Configure UptimeRobot** para monitorar `https://api.cultiv.app/health`
5. **Teste o deploy automático** com um push para `main`

---

> **Dica:** Se travar em algum passo, copie o erro exato e me envie. Não desista! 🚀

