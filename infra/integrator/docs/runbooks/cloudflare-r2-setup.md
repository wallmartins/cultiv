# Cloudflare R2 — Backup Storage Setup

## Overview

This guide configures **Cloudflare R2** as the backup storage for the Cultiv backend. R2 is S3-compatible, has a **10GB free tier**, and charges **$0 for egress** — critical for disaster recovery.

## Prerequisites

- Cloudflare account (free plan)
- Cloudflare R2 enabled (free tier: 10GB storage)
- Integrator VPS provisioned with `rclone` installed (via bootstrap script)
- Domain `cultiv.app` in Cloudflare (not strictly required for R2, but good for organization)

---

## Part 1: Create R2 Bucket

### Step 1: Open R2 in Cloudflare dashboard

1. Go to [dash.cloudflare.com](https://dash.cloudflare.com)
2. Select your account
3. Go to **R2 Object Storage** (left sidebar)
4. Click **Create bucket**

### Step 2: Configure bucket

- **Bucket name**: `cultiv-backups`
- **Location**: Default (automatic)
- **Storage class**: Standard
- Click **Create bucket**

### Step 3: Enable public access (optional, for direct download)

1. Go to the bucket **Settings**
2. Under **Access**, enable **R2.dev subdomain**
3. This creates a public URL: `https://pub-<hash>.r2.dev`
4. **Note:** This is optional. `rclone` does not need public access.

---

## Part 2: Create R2 API Token

### Step 1: Generate API token

1. Go to **R2** → **Manage R2 API Tokens**
2. Click **Create API token**
3. Name: `cultiv-backup-token`
4. Permissions:
   - **Object Read & Write**: ✅ (required for upload and download)
5. TTL: **Forever** (or set expiration if you prefer)
6. Click **Create API Token**

### Step 2: Save credentials

Cloudflare will show:
- **Access Key ID**: `xxxxxxxxxxxxxxxxxxxxxxxx`
- **Secret Access Key**: `yyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyy`
- **Jurisdiction-specific endpoint**: `https://<account-id>.r2.cloudflarestorage.com`

**Save these securely** — they are shown only once. Store them in a password manager.

---

## Part 3: Configure rclone on the VPS

### Step 1: Create rclone config

On the **Integrator VPS**, run:

```bash
rclone config
```

Interactive steps:
1. `n` → New remote
2. Name: `r2`
3. Storage: `5` (S3) or type `s3`
4. Provider: `Cloudflare` (select from list or type `Cloudflare`)
5. Access Key ID: `<paste your Access Key ID>`
6. Secret Access Key: `<paste your Secret Access Key>`
7. Region: `auto`
8. Endpoint: `https://<account-id>.r2.cloudflarestorage.com`
9. ACL: `private`
10. Advanced config: `n` (no)
11. Confirm: `y` (yes)

### Step 2: Verify rclone

Test connection:
```bash
rclone ls r2:cultiv-backups
```

Expected: empty list (bucket is new) or existing backups.

Test upload:
```bash
echo "test" > /tmp/test-backup.txt
rclone copy /tmp/test-backup.txt r2:cultiv-backups/
rclone ls r2:cultiv-backups/
# Should show: test-backup.txt
```

---

## Part 4: Configure Backup Script

The `backup.sh` script already uses `rclone`. You just need to set environment variables.

### Step 1: Add R2 variables to `.env`

```bash
# Cloudflare R2
R2_BUCKET_NAME=cultiv-backups
R2_ENDPOINT=https://<account-id>.r2.cloudflarestorage.com
R2_ACCESS_KEY_ID=xxxxxxxxxxxxxxxxxxxxxxxx
R2_SECRET_ACCESS_KEY=yyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyy
```

### Step 2: Export to environment

```bash
# Add to /home/cultiv/.bashrc or /etc/environment
export R2_BUCKET_NAME=cultiv-backups
export R2_ENDPOINT=https://<account-id>.r2.cloudflarestorage.com
export R2_ACCESS_KEY_ID=xxxxxxxxxxxxxxxxxxxxxxxx
export R2_SECRET_ACCESS_KEY=yyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyy
```

Or create a systemd service file for `rclone` if needed.

### Step 3: Run backup manually

```bash
/home/cultiv/cultiv/scripts/backup.sh
```

Check logs:
```bash
tail -f /home/cultiv/cultiv/logs/backup.log
```

Verify in R2:
```bash
rclone ls r2:cultiv-backups
```

---

## Part 5: Configure R2 for rclone in backup script

The `backup.sh` script uses `rclone` with S3-compatible options. The script expects:

```bash
R2_BUCKET_NAME=cultiv-backups
R2_ENDPOINT=https://<account-id>.r2.cloudflarestorage.com
```

rclone reads credentials from:
1. `~/.config/rclone/rclone.conf` (created during `rclone config`)
2. Environment variables: `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`

If you use `rclone config`, the script works as-is. If you prefer environment variables, the script also checks for them.

### Alternative: Use rclone remote name

If you named your rclone remote `r2` (as in the guide), you can also update the script to use:

```bash
rclone copy "${BACKUP_DIR}/db-${DATE}.sql.gz" "r2:${R2_BUCKET}/"
```

Instead of the S3-compatible flags. The current script works with both methods.

---

## Part 6: R2 Costs and Monitoring

### Free tier

| Resource | Free | Paid |
|----------|------|------|
| Storage | 10GB | $0.015/GB |
| Class A operations (write) | 1M/month | $4.50/M |
| Class B operations (read) | 10M/month | $0.36/M |
| Egress | Unlimited | $0 |

### Estimated cost for Cultiv

| Metric | Estimate | Cost |
|--------|----------|------|
| Daily backup (500MB) | 15GB/month | $0 (within 10GB free) |
| Over 10GB | 5GB | $0.075/month |
| Write operations | ~30/month | $0 |
| Read operations (verify) | ~10/month | $0 |
| **Total** | | **$0-0.08/month** |

### Monitor usage

```bash
# Check bucket size
rclone size r2:cultiv-backups

# List all backups
rclone ls r2:cultiv-backups
```

---

## Part 7: R2 Security

### Best practices

1. **Use a dedicated API token** (not your global Cloudflare API key)
2. **Restrict token permissions** (Object Read & Write only)
3. **Rotate keys periodically** (every 6-12 months)
4. **Never commit keys** to git
5. **Use `.env` file** with `chmod 600`

### R2 bucket policies

In Cloudflare dashboard:
1. Go to R2 → `cultiv-backups` → **Settings**
2. Under **CORS**, configure if needed
3. Under **Lifecycle rules**, you can add auto-deletion after 30 days (optional)

---

## Part 8: Disaster Recovery with R2

### Download backup

```bash
# List backups
rclone ls r2:cultiv-backups

# Download latest
rclone copy r2:cultiv-backups/db-2026-06-15-0300.sql.gz /tmp/

# Restore
gunzip -c /tmp/db-2026-06-15-0300.sql.gz | docker exec -i cultiv-postgres psql -U cultiv -d cultiv
```

### Verify backup

The `verify-backup.sh` script does this automatically:
1. Downloads latest backup from R2
2. Restores to temporary container
3. Verifies data integrity
4. Reports to Discord

---

## Verification Checklist

| # | Check | Command |
|---|-------|---------|
| 1 | Bucket created | Cloudflare dashboard |
| 2 | API token created | Cloudflare dashboard |
| 3 | rclone configured | `rclone config show` |
| 4 | rclone can list | `rclone ls r2:cultiv-backups` |
| 5 | rclone can upload | `rclone copy test.txt r2:cultiv-backups/` |
| 6 | Backup script works | `./scripts/backup.sh` |
| 7 | Backup appears in R2 | `rclone ls r2:cultiv-backups` |
| 8 | Verify script works | `./scripts/verify-backup.sh` |

---

## Next Steps

After R2 is configured, the backup pipeline is complete. Next:

1. Configure the **GitHub Actions self-hosted runner** on the VPS
2. Test the **deploy pipeline**
3. Run the **go-live checklist**
