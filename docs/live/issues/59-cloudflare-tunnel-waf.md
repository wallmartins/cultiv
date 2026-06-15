---
title: Cloudflare Tunnel and WAF Setup
doc_type: issue
status: ready-for-agent
domain: backend-platform
slice_type: AFK
last_updated: 2026-06-15
---

# Cloudflare Tunnel and WAF setup

## Parent

- [`issue-integrator-cloudflare-deploy.md`](../prd/issue-integrator-cloudflare-deploy.md)
- ADR: [`0005-integrator-cloudflare-deploy.md`](../../adr/0005-integrator-cloudflare-deploy.md)

## What to build

Configure Cloudflare as the edge proxy for the Integrator VPS. SSL termination, DDoS protection, and bot management are handled at the edge. The VM connects via an outbound tunnel (no inbound ports exposed).

### Deliverables

1. **Cloudflare DNS**
   - Zone: `cultiv.app` (or subdomain, e.g., `api.cultiv.app`)
   - DNS record: `api` (or configured subdomain) → proxied (orange cloud)
   - Initially points to Cloudflare Tunnel, not VM IP directly

2. **Cloudflare Tunnel (cloudflared)**
   - Install `cloudflared` on VM: `cloudflared` daemon for ARM64
   - Authenticate: `cloudflared tunnel login` (one-time browser auth)
   - Create tunnel: `cloudflared tunnel create cultiv-integrator`
   - Route DNS: `cloudflared tunnel route dns <UUID> api.cultiv.app`
   - Config file: `/etc/cloudflared/config.yml` with ingress rules
     - `api.cultiv.app` → `http://localhost:80`
     - Default: `http_status:404`
   - Run as systemd service: `cloudflared service install`
   - Verify: `cloudflared tunnel info <UUID>`

3. **Cloudflare WAF rules**
   - Security level: Medium (or High if bot traffic detected)
   - Rate limiting: 100 requests per minute per IP (first line of defense)
   - Bot Fight Mode: enabled (free tier)
   - DDoS protection: enabled by default
   - SSL/TLS: Full (strict) — Cloudflare validates origin certificate
     - Since we use Tunnel, this is simplified; set to Flexible or Full

4. **SSL/TLS configuration**
   - Mode: `Full` (Cloudflare validates origin, but we use Tunnel so origin is local)
   - Actually for Tunnel: `Flexible` is sufficient because Tunnel is trusted
   - Or use `Full` if we add a self-signed cert on Nginx
   - For simplicity: `Flexible` (Cloudflare → Tunnel is encrypted)
   - **Better:** Generate self-signed cert for Nginx and use `Full (strict)`
   - Or: don't bother with Nginx TLS, use `Flexible` (Cloudflare manages TLS to client)

5. **Page rules (optional)**
   - `api.cultiv.app/health` → Cache Level: Bypass (never cache health)
   - `api.cultiv.app/*` → Cache Level: Bypass (API is dynamic)

6. **Cloudflare Zero Trust SSH**
   - Create application in Cloudflare Zero Trust dashboard: `Access` → `Applications` → `Self-hosted`
   - Subdomain: `ssh.cultiv.app` (or configured)
   - Identity provider: Google, GitHub, or email (with 2FA)
   - Add your email to allowed users (50 users free tier)
   - Install `cloudflared` on VM as SSH server: `cloudflared access ssh`
   - Configure `~/.ssh/config` on local machine for `cloudflared access ssh`
   - Test: `cloudflared access ssh --hostname ssh.cultiv.app`
   - Document: SSH access is now browser-based or via `cloudflared` CLI

7. **Auth0 callback update**
   - Update Auth0 tenant: add `https://api.cultiv.app` (or configured domain) to allowed callback URLs
   - Update CORS in backend: `CORS_ALLOWED_ORIGINS=https://www.cultiv.app,https://cultiv.app,https://api.cultiv.app`

## Acceptance criteria

- [ ] Cloudflare DNS record `api.cultiv.app` (or configured) resolves and is proxied.
- [ ] `cloudflared` installed and running as systemd service on VM.
- [ ] Tunnel status: `Active` in Cloudflare Zero Trust dashboard.
- [ ] `curl https://api.cultiv.app/health` from local machine returns 200.
- [ ] WAF rules configured (rate limiting, bot fight mode).
- [ ] SSL/TLS mode configured (Full or Flexible documented).
- [ ] Auth0 callback URL updated to include Cloudflare endpoint.
- [ ] Cloudflare Zero Trust SSH application created and accessible.
- [ ] SSH into VM via `cloudflared access ssh` works (tested).
- [ ] Document saved in `docs/runbooks/cloudflare-tunnel-setup.md`.

## Blocked by

None. Requires Cloudflare account with DNS zone for `cultiv.app`. Can be done in parallel with issue 58.

## Notes

- Cloudflare Tunnel is free and unlimited for personal use.
- The tunnel is outbound: VM initiates connection to Cloudflare. No inbound firewall rules needed.
- If the tunnel stops, the API becomes unreachable. Health check will catch this.
- Cloudflare's `CF-Connecting-IP` header is used by the backend for rate limiting.
