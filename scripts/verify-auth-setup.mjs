#!/usr/bin/env node
/**
 * Auth setup smoke check (no secrets printed).
 *
 * Usage (from repo root):
 *   node scripts/verify-auth-setup.mjs
 *   ACCESS_TOKEN='eyJ...' node scripts/verify-auth-setup.mjs
 */
import { config as loadDotEnv } from "dotenv";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
loadDotEnv({ path: resolve(root, ".env"), quiet: true });
loadDotEnv({ path: resolve(root, "apps/web/.env"), quiet: true });

const webEnv = parseEnvFile(resolve(root, "apps/web/.env"));

const checks = [];

function flag(name, value) {
  const ok = typeof value === "string" && value.trim().length > 0;
  checks.push({ name, ok });
  console.log(`${ok ? "✓" : "✗"} ${name}: ${ok ? "set" : "missing"}`);
}

function read(name) {
  return process.env[name] ?? webEnv[name];
}

const domain = read("VITE_AUTH0_DOMAIN");
const audience = read("VITE_AUTH0_AUDIENCE") ?? process.env.AUTH_AUDIENCE;
const issuer = process.env.AUTH_ISSUER_URL;
const jwks = process.env.AUTH_JWKS_URL;
const siteUrl = read("SITE_URL") ?? "http://localhost:3000";
const apiBaseUrl = read("VITE_API_BASE_URL") ?? siteUrl;
const port = process.env.PORT ?? "3001";

console.log("=== Cultiv auth setup check ===\n");
console.log("Web (Auth0 SPA)");
flag("VITE_AUTH0_DOMAIN", domain);
flag("VITE_AUTH0_CLIENT_ID", read("VITE_AUTH0_CLIENT_ID"));
flag("VITE_AUTH0_AUDIENCE", read("VITE_AUTH0_AUDIENCE"));
flag("SITE_URL", read("SITE_URL"));
flag("VITE_API_BASE_URL", read("VITE_API_BASE_URL"));

console.log("\nBackend (JWT validation)");
flag("AUTH_ISSUER_URL", issuer);
flag("AUTH_AUDIENCE", process.env.AUTH_AUDIENCE);
flag("AUTH_JWKS_URL", jwks);

if (read("VITE_AUTH0_AUDIENCE") && process.env.AUTH_AUDIENCE) {
  const match = read("VITE_AUTH0_AUDIENCE") === process.env.AUTH_AUDIENCE;
  console.log(`${match ? "✓" : "✗"} audience alignment (web === backend): ${match ? "ok" : "MISMATCH"}`);
  checks.push({ name: "audience-alignment", ok: match });
}

const expectedIssuer = domain ? `https://${domain.replace(/^https?:\/\//, "").replace(/\/$/, "")}/` : null;
if (expectedIssuer && issuer) {
  const match = issuer === expectedIssuer;
  console.log(`${match ? "✓" : "✗"} issuer matches tenant domain: ${match ? "ok" : `expected ${expectedIssuer}`}`);
  checks.push({ name: "issuer-alignment", ok: match });
}

const expectedJwks = domain
  ? `https://${domain.replace(/^https?:\/\//, "").replace(/\/$/, "")}/.well-known/jwks.json`
  : null;
if (expectedJwks && jwks) {
  const match = jwks === expectedJwks;
  console.log(`${match ? "✓" : "✗"} JWKS URL: ${match ? "ok" : `expected ${expectedJwks}`}`);
}

console.log("\nReachability");
if (expectedJwks || jwks) {
  const url = jwks ?? expectedJwks;
  try {
    const res = await fetch(url);
    console.log(`${res.ok ? "✓" : "✗"} JWKS endpoint HTTP ${res.status}`);
    checks.push({ name: "jwks-http", ok: res.ok });
  } catch (error) {
    console.log(`✗ JWKS endpoint: ${error instanceof Error ? error.message : String(error)}`);
    checks.push({ name: "jwks-http", ok: false });
  }
}

const apiBase = apiBaseUrl.replace(/\/$/, "");
const healthUrl = `http://127.0.0.1:${port}/health`;
try {
  const res = await fetch(healthUrl);
  console.log(`${res.ok ? "✓" : "✗"} backend ${healthUrl} HTTP ${res.status}`);
  checks.push({ name: "backend-health", ok: res.ok });
} catch {
  console.log(`✗ backend ${healthUrl}: not reachable (start with: cd apps/backend && pnpm dev)`);
  checks.push({ name: "backend-health", ok: false });
}

console.log(`\nSDK will call API at: ${apiBase}`);
if (read("VITE_API_BASE_URL") && !apiBase.includes(`:${port}`)) {
  console.log(
    "⚠ VITE_API_BASE_URL não usa a mesma porta que PORT do backend (",
    port,
    ")."
  );
}

const token = process.env.ACCESS_TOKEN;
if (token) {
  console.log("\nAuthenticated API probe");
  const res = await fetch(`${apiBase}/me/content-types`, {
    headers: { Authorization: `Bearer ${token}`, Accept: "application/json" }
  });
  const body = await res.text();
  console.log(`${res.ok ? "✓" : "✗"} GET /me/content-types HTTP ${res.status}`);
  if (!res.ok) {
    console.log("  response:", body.slice(0, 200));
  } else {
    console.log("  body preview:", body.slice(0, 120), "…");
  }
  checks.push({ name: "authenticated-api", ok: res.ok });
} else {
  console.log("\nTip: após login no browser, rode com ACCESS_TOKEN para testar a API:");
  console.log("  ACCESS_TOKEN='<cole o access_token>' node scripts/verify-auth-setup.mjs");
}

const failed = checks.filter((c) => !c.ok);
console.log(failed.length === 0 ? "\nAll automated checks passed." : `\n${failed.length} check(s) need attention.`);
process.exit(failed.length === 0 ? 0 : 1);

function parseEnvFile(path) {
  if (!existsSync(path)) {
    return {};
  }

  const out = {};
  for (const line of readFileSync(path, "utf8").split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) {
      continue;
    }
    const eq = trimmed.indexOf("=");
    if (eq === -1) {
      continue;
    }
    out[trimmed.slice(0, eq).trim()] = trimmed.slice(eq + 1).trim();
  }
  return out;
}
