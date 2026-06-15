---
title: Integrator VPS Provisioning and Home Region
doc_type: issue
status: ready-for-agent
domain: backend-platform
slice_type: AFK
last_updated: 2026-06-15
---

# Integrator VPS provisioning and home region

## Parent

- [`issue-integrator-cloudflare-deploy.md`](../prd/issue-integrator-cloudflare-deploy.md)
- ADR: [`0005-integrator-cloudflare-deploy.md`](../../adr/0005-integrator-cloudflare-deploy.md)

## What to build

Create and configure an Integrator Brasil VPS VM (ARM-based) in the optimal region for global reach from day 1.

### Deliverables

1. **Integrator account setup**
   - Create tenancy (if not existing)
   - Verify account (credit card required for Always Free, but not charged)
   - Enable Always Free tier

2. **Home region decision**
   - Primary: São Paulo (`sa-saopaulo-1`) — best latency for Brazil, default locale pt-BR, LGPD alignment
   - Contingency: If São Paulo quota unavailable, fallback to Ashburn (`us-ashburn-1`) — higher availability, acceptable latency for async workflows
   - Document final choice in runbook

3. **VM provisioning**
   - Shape: `VM.Standard.A1.Flex` (ARM)
   - Recommended: 2 OCPUs + 12GB RAM (leaves 2 OCPUs for future expansion)
   - Alternative: 4 OCPUs + 24GB RAM if maximal resources desired
   - Image: Ubuntu 26.04 LTS
   - Boot volume: 200GB (Always Free limit)
   - Networking: VCN + public subnet + Security List
   - SSH key pair: generate new RSA 2048 or use existing
   - Reserved Public IP: assign to VM

4. **Security List configuration**
   - **Zero inbound ports** — no SSH, no HTTP, no HTTPS
   - All access (API and SSH) goes through Cloudflare Tunnel / Zero Trust
   - No IP whitelisting needed (Cloudflare handles identity)

5. **Initial access verification**
   - SSH into VM with key pair
   - Verify connectivity: `ping`, `curl`, `apt update`
   - Document SSH command in runbook

## Acceptance criteria

- [ ] Integrator account created and verified.
- [ ] VM provisioned and accessible via SSH.
- [ ] Home region documented (São Paulo or Ashburn with rationale).
- [ ] Security List configured: only port 22 open.
- [ ] Reserved Public IP assigned.
- [ ] VM passes basic connectivity test (`ping 8.8.8.8`, `curl https://github.com`).
- [ ] Document saved in `docs/runbooks/integrator-vps-provisioning.md`.

## Blocked by

None. Requires Integrator account with verified payment method.

## Notes

- São Paulo frequently has capacity issues for Always Free. Try early morning.
- If São Paulo fails, use Ashburn without guilt — latency for async is acceptable.
- Do not attach boot volume > 200GB (Always Free limit).
