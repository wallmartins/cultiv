# Cloudflare Tunnel + Zero Trust SSH — Setup Guide

## Overview

This guide configures **Cloudflare Tunnel** (`cloudflared`) to expose the Cultiv backend to the internet **without opening any inbound ports** on the Integrator VPS. It also configures **Cloudflare Zero Trust SSH** for secure, browser-based SSH access without exposing the SSH port.

**Security principle:** Zero inbound ports. The VPS initiates outbound connections to Cloudflare. No firewall rules needed for HTTP/HTTPS/SSH.

## Prerequisites

- Cloudflare account (free plan)
- Domain `cultiv.app` added to Cloudflare DNS
- Integrator VPS provisioned with Ubuntu 26.04 LTS
- `cloudflared` installed on the VPS (via bootstrap script)

---

## Part 1: Cloudflare Tunnel

### Step 1: Authenticate cloudflared

On the **Integrator VPS**, run:

```bash
cloudflared tunnel login
```

This will:
1. Print a URL
2. Open the URL in your browser
3. Ask you to authenticate with Cloudflare
4. Select the `cultiv.app` zone
5. Download a certificate (`cert.pem`) to `~/.cloudflared/`

**Save this certificate** — it authorizes the VPS to create tunnels.

### Step 2: Create the tunnel

```bash
cloudflared tunnel create cultiv-backend
```

Output:
```
Tunnel credentials written to /home/cultiv/.cloudflared/<tunnel-id>.json
Tunnel ID: <tunnel-id>
```

**Save the Tunnel ID** — you will need it.

### Step 3: Create the config file

Create `/home/cultiv/.cloudflared/config.yml`:

```yaml
tunnel: <tunnel-id>
credentials-file: /home/cultiv/.cloudflared/<tunnel-id>.json

ingress:
  # API — main backend
  - hostname: api.cultiv.app
    service: http://127.0.0.1:80
    
  # SSH via Zero Trust (optional, can be separate)
  - hostname: ssh.cultiv.app
    service: ssh://127.0.0.1:22
    
  # Default: deny everything else
  - service: http_status:404
```

### Step 4: Route DNS

```bash
cloudflared tunnel route dns cultiv-backend api.cultiv.app
cloudflared tunnel route dns cultiv-backend ssh.cultiv.app
```

This creates CNAME records in Cloudflare DNS:
- `api.cultiv.app` → `<tunnel-id>.cfargotunnel.com`
- `ssh.cultiv.app` → `<tunnel-id>.cfargotunnel.com`

### Step 5: Install as a service

```bash
cloudflared service install
systemctl enable cloudflared
systemctl start cloudflared
```

Verify:
```bash
systemctl status cloudflared
cloudflared tunnel info cultiv-backend
```

You should see:
- `api.cultiv.app` → Active
- `ssh.cultiv.app` → Active

---

## Part 2: Cloudflare Zero Trust SSH

### Step 1: Enable Zero Trust SSH

In the Cloudflare dashboard:
1. Go to **Zero Trust** → **Access** → **Applications**
2. Click **Add an application**
3. Select **Self-hosted**
4. Name: `Cultiv SSH`
5. Session duration: `24h`
6. Click **Next**

### Step 2: Configure policy

Add a policy:
- Name: `Allow operators`
- Action: `Allow`
- Include:
  - Email: `your-email@example.com` (your email)
  - Or: Identity provider group (if using Google/OTP)

Click **Next** → **Next** → **Save**.

### Step 3: Configure SSH browser rendering

In the application settings:
1. Go to **Settings** tab
2. Under **Browser rendering**, select **SSH**
3. Save

### Step 4: Connect via browser

Open in your browser:
```
https://ssh.cultiv.app
```

You will:
1. Authenticate with Cloudflare (email OTP or Google)
2. See a terminal in the browser
3. Connect directly to the VPS via SSH

### Step 5: Connect via CLI (optional)

Install `cloudflared` on your local machine:
```bash
# macOS
brew install cloudflared

# Linux
wget https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64
chmod +x cloudflared-linux-amd64
sudo mv cloudflared-linux-amd64 /usr/local/bin/cloudflared
```

Add to `~/.ssh/config`:
```
Host integrator-vps
    HostName ssh.cultiv.app
    User cultiv
    ProxyCommand /usr/local/bin/cloudflared access ssh --hostname %h
```

Connect:
```bash
ssh integrator-vps
```

---

## Part 3: Verify Zero Inbound Ports

On the VPS:
```bash
sudo ss -tlnp | grep -E '22|80|443|3001'
```

Expected output:
```
127.0.0.1:80     nginx
127.0.0.1:3001   node
127.0.0.1:5432   docker
127.0.0.1:6379   docker
127.0.0.1:22     sshd
```

No `0.0.0.0` (all interfaces) entries for any port.

External test:
```bash
# From your local machine
nmap <integrator-vps-ip>
```

Expected: **No open ports** (all filtered/closed).

---

## Part 4: Troubleshooting

### Tunnel not connecting

```bash
# Check logs
journalctl -u cloudflared -f

# Check tunnel status
cloudflared tunnel info cultiv-backend

# Restart
sudo systemctl restart cloudflared
```

### DNS not resolving

```bash
# Check Cloudflare DNS records
dig api.cultiv.app
# Should return a Cloudflare IP (not your VPS IP)
```

### Zero Trust SSH not working

1. Check that `ssh.cultiv.app` is in the tunnel config
2. Check Cloudflare Access policies (email must match)
3. Check that `cloudflared access` is installed locally
4. Check browser console for errors

### Certificate expired

```bash
cloudflared tunnel login
# Re-authenticate and select zone
```

---

## Part 5: Cloudflare WAF + SSL

### SSL/TLS

In Cloudflare dashboard:
1. Go to **SSL/TLS** → **Overview**
2. Set mode: **Full (strict)**
3. This ensures end-to-end encryption (Cloudflare → VPS)

### WAF Rules

1. Go to **Security** → **WAF**
2. Enable:
   - **Bot Fight Mode** (free tier)
   - **Security Level**: Medium
   - **Challenge Passage**: 30 minutes

### Rate Limiting

1. Go to **Security** → **WAF** → **Rate limiting rules**
2. Create rule:
   - Name: `API rate limit`
   - URL: `api.cultiv.app/*`
   - Threshold: 100 requests per 10 seconds
   - Action: Block

---

## Verification Checklist

| # | Check | Command/URL |
|---|-------|-------------|
| 1 | Tunnel active | `cloudflared tunnel info cultiv-backend` |
| 2 | DNS resolves | `dig api.cultiv.app` |
| 3 | HTTPS works | `curl -I https://api.cultiv.app/health` |
| 4 | SSL valid | Browser lock icon |
| 5 | Zero ports exposed | `nmap <vps-ip>` |
| 6 | Zero Trust SSH works | `https://ssh.cultiv.app` |
| 7 | WAF active | Check Cloudflare dashboard |
| 8 | Rate limiting active | Check Cloudflare dashboard |

---

## Next Steps

After Tunnel + SSH are working, configure **Cloudflare R2** for backups:

→ [`cloudflare-r2-setup.md`](./cloudflare-r2-setup.md)
