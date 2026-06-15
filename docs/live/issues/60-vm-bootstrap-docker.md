---
title: VM Bootstrap and Docker Compose
doc_type: issue
status: ready-for-agent
domain: backend-platform
slice_type: AFK
last_updated: 2026-06-15
---

# VM bootstrap and Docker Compose

## Parent

- [`issue-integrator-cloudflare-deploy.md`](../prd/issue-integrator-cloudflare-deploy.md)
- ADR: [`0005-integrator-cloudflare-deploy.md`](../../adr/0005-integrator-cloudflare-deploy.md)

## What to build

Install all system dependencies on the Integrator VPS and configure Docker Compose for PostgreSQL and Redis. This is the foundation layer that all subsequent services depend on.

### Deliverables

1. **System packages**
   - Update and upgrade: `apt update && apt upgrade -y`
    - Install: `docker.io`, `docker-compose-plugin`, `nginx`, `certbot`, `logrotate`, `ufw`, `unattended-upgrades`, `jq`, `bc`, `curl`, `rsync`
    - No `fail2ban` — SSH is not exposed to internet (Cloudflare Zero Trust)
   - Add user `ubuntu` to `docker` group
   - Docker: `systemctl enable docker`

2. **Node.js environment**
   - Node.js 22.x via NodeSource
   - pnpm 11.3.0 via npm: `npm install -g pnpm@11.3.0`
   - PM2 via npm: `npm install -g pm2`
   - Verify: `node --version`, `pnpm --version`, `pm2 --version`

3. **Security hardening**
   - UFW: `deny incoming`, `allow outgoing` — no SSH port exposed
   - unattended-upgrades: security updates only, no auto-reboot
   - SSH: `PermitRootLogin no`, `PasswordAuthentication no` (key only, but port not exposed)
   - **Cloudflare Zero Trust SSH**:
     - Create SSH application in Cloudflare Zero Trust dashboard
     - Add `ssh.cultiv.app` (or configured subdomain) as SSH endpoint
     - Configure identity provider (Google, GitHub, or email + 2FA)
     - Install `cloudflared` on VM and register as SSH server
     - Access: `cloudflared access ssh --hostname ssh.cultiv.app` or browser

4. **Directory structure**
   ```
   /home/ubuntu/cultiv/
   ├── app/                    # code deploy
   ├── data/
   │   ├── postgres/          # PG volume
   │   ├── redis/             # Redis volume
   │   └── backups/           # local dumps
   ├── logs/                  # app logs
   ├── metrics/               # metrics JSON
   ├── scripts/               # automation scripts
   └── docs/                  # runbooks
   ```

5. **Docker Compose**
   - `docker-compose.yml` in `/home/ubuntu/cultiv/`
   - PostgreSQL 16 Alpine:
     - `POSTGRES_USER=cultiv`, `POSTGRES_PASSWORD` from env
     - Bind mount: `/home/ubuntu/cultiv/data/postgres`
     - Port: `127.0.0.1:5432`
     - Healthcheck: `pg_isready`
   - Redis 7 Alpine:
     - Command: `redis-server --appendonly yes`
     - Bind mount: `/home/ubuntu/cultiv/data/redis`
     - Port: `127.0.0.1:6379`
     - Healthcheck: `redis-cli ping`
   - Both services: `restart: unless-stopped`

6. **Nginx configuration**
   - Listen: `127.0.0.1:80` only (no external exposure)
   - Server name: `localhost`
   - `proxy_pass` to `127.0.0.1:3001`
   - Headers: `Host`, `X-Real-IP`, `X-Forwarded-For`, `X-Forwarded-Proto`, `CF-Connecting-IP`
   - Location `/health`: pass to backend, no caching
   - Location `/metrics`: serve JSON file from `/home/ubuntu/cultiv/metrics/current.json`
   - Timeout: `proxy_read_timeout 300s`

7. **cloudflared configuration**
   - `config.yml` in `/etc/cloudflared/`
   - Tunnel UUID and credentials file
   - Ingress: `api.cultiv.app` → `http://localhost:80`
   - Service: `systemctl enable cloudflared`

8. **logrotate configuration**
   - `/etc/logrotate.d/cultiv`: rotate logs in `/home/ubuntu/cultiv/logs/`
   - Daily, 14 days retention, compress, `create` permissions
   - `/etc/logrotate.d/pm2`: rotate PM2 logs, `copytruncate`

9. **Bootstrap script**
   - `scripts/bootstrap-vm.sh`: automates all of the above
   - One-shot script that can be run on a fresh VM to reach "ready for app deploy" state

## Acceptance criteria

- [ ] All system packages installed and verified.
- [ ] Docker running; `docker ps` works without `sudo`.
- [ ] `docker compose up -d` brings up PostgreSQL and Redis.
- [ ] PostgreSQL responds: `docker exec cultiv-postgres pg_isready -U cultiv`
- [ ] Redis responds: `docker exec cultiv-redis redis-cli ping` → `PONG`
- [ ] Nginx running and responding on `127.0.0.1:80`.
- [ ] cloudflared running and active in Cloudflare dashboard.
- [ ] `bootstrap-vm.sh` script exists and is tested on a fresh VM (or documented).
- [ ] UFW active (deny incoming), unattended-upgrades configured.
- [ ] Cloudflare Zero Trust SSH application configured and accessible.
- [ ] SSH access via `cloudflared access ssh` works (tested).
- [ ] Directory structure created and permissions correct.

## Blocked by

- Issue 58 (VM must be provisioned before bootstrapping)
- Issue 59 (Cloudflare Tunnel must be configured; cloudflared installed during bootstrap)

## Notes

- This is the longest step. Allocate 2-3 hours.
- The bootstrap script should be idempotent (safe to run multiple times).
- Document all passwords/secrets in a password manager (1Password, KeePass), never in the repo.
- Test the script on a fresh VM if possible (or document clearly that it is designed for first-run).
- **Cloudflare Zero Trust SSH** replaces traditional SSH access. You will no longer use `ssh ubuntu@<ip>` directly.
- Keep a backup access method: Integrator hPanel provides emergency VNC/serial console access (password-based, slow but works if everything else fails).
