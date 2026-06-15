#!/usr/bin/env node
/**
 * One-shot backend src layout migration.
 * Run from repository root: node scripts/restructure-backend-src.mjs
 */
import { mkdirSync, readFileSync, renameSync, writeFileSync, existsSync, readdirSync, statSync } from "node:fs";
import { dirname, join, relative, resolve } from "node:path";

const repoRoot = resolve(import.meta.dirname, "..");
const srcRoot = join(repoRoot, "apps/backend/src");

function listFilesRecursive(dir, prefix = "") {
  const entries = readdirSync(dir);
  /** @type {string[]} */
  const files = [];
  for (const entry of entries) {
    const fullPath = join(dir, entry);
    const relativePath = prefix ? `${prefix}/${entry}` : entry;
    if (statSync(fullPath).isDirectory()) {
      files.push(...listFilesRecursive(fullPath, relativePath));
      continue;
    }
    files.push(relativePath);
  }
  return files;
}

function globSrc(patternPrefix, suffix) {
  return listFilesRecursive(srcRoot)
    .filter((file) => file.startsWith(patternPrefix) && file.endsWith(suffix));
}

/** @type {readonly (readonly [string, string])[]} */
const MOVES = [
  ["main.ts", "cli/main.ts"],
  ["worker-main.ts", "cli/worker-main.ts"],
  ["migrate.ts", "cli/migrate.ts"],
  ["rotate-voice-protection-key.ts", "cli/rotate-voice-protection-key.ts"],
  ["config.ts", "config/config.ts"],
  ["config-auth.ts", "config/config-auth.ts"],
  ["utils.ts", "internal/utils.ts"],
  ["http.ts", "http/http.ts"],
  ["errors.ts", "http/errors.ts"],
  ["error-response.ts", "http/error-response.ts"],
  ["error-response-core.ts", "http/error-response-core.ts"],
  ["app.ts", "app/app.ts"],
  ["bootstrap.ts", "app/bootstrap.ts"],
  ["routes.ts", "app/routes.ts"],
  ["route-definitions.ts", "app/route-definitions.ts"],
  ["production-hardening.ts", "app/production-hardening.ts"],
  ["auth.ts", "auth/index.ts"],
  ["content-type-routes.ts", "routes/content-type-routes.ts"],
  ["dev-showcase-routes.ts", "routes/dev-showcase-routes.ts"],
  ["execution-routes.ts", "routes/execution-routes.ts"],
  ["experimental-execution-routes.ts", "routes/experimental-execution-routes.ts"],
  ["generation-preview-routes.ts", "routes/generation-preview-routes.ts"],
  ["internal-override-routes.ts", "routes/internal-override-routes.ts"],
  ["internal-policy-routes.ts", "routes/internal-policy-routes.ts"],
  ["voice-routes.ts", "routes/voice-routes.ts"],
  ["worker.ts", "jobs/worker.ts"],
  ["worker-job.ts", "jobs/worker-job.ts"],
  ["job-store.ts", "jobs/job-store.ts"],
  ["job-events.ts", "jobs/job-events.ts"],
  ["memory.ts", "memory/memory.ts"],
  ["memory-store.ts", "memory/memory-store.ts"],
  ["memory-corpus.ts", "memory/memory-corpus.ts"],
  ...globSrc("product", "/ai-policy-*.ts").map((file) => [file, `product/ai-policy/${file.slice("product/".length)}`]),
  ...globSrc("product", "/safety-policy-*.ts").map((file) => [
    file,
    `product/safety-policy/${file.slice("product/".length)}`
  ]),
  ...globSrc("product", "/voice-*.ts").map((file) => [file, `product/voice/${file.slice("product/".length)}`]),
  ["product/protected-voice-training-database.ts", "product/voice/protected-voice-training-database.ts"],
  ...listFilesRecursive(srcRoot)
    .filter((file) => file.startsWith("product/usage-policy"))
    .map((file) => [file, `product/usage/${file.slice("product/".length)}`]),
  ...listFilesRecursive(srcRoot)
    .filter((file) => file.startsWith("product/generation-preview"))
    .map((file) => [file, `product/generation/${file.slice("product/".length)}`]),
  ["product/public-generation.ts", "product/generation/public-generation.ts"],
  ["product/public-generation-types.ts", "product/generation/public-generation-types.ts"],
  ["product/durable-billing.ts", "product/billing/durable-billing.ts"],
  ["product/billing-bootstrap.ts", "product/billing/billing-bootstrap.ts"],
  ["product/commercial-access.ts", "product/billing/commercial-access.ts"],
  ["product/generation-pricing-snapshot.ts", "product/billing/generation-pricing-snapshot.ts"],
  ["product/content-type-catalog.ts", "product/catalog/content-type-catalog.ts"],
  ["product/content-type-presets.ts", "product/catalog/content-type-presets.ts"],
  ["product/resolve-catalog-content-types.ts", "product/catalog/resolve-catalog-content-types.ts"],
  ["product/persistence-content-types.ts", "product/catalog/persistence-content-types.ts"],
  ["product/persistence.ts", "product/persistence/persistence.ts"],
  ["product/persistence-types.ts", "product/persistence/persistence-types.ts"],
  ["product/persistence-jobs.ts", "product/persistence/persistence-jobs.ts"],
  ["product/persistence-memory.ts", "product/persistence/persistence-memory.ts"],
  ["product/services.ts", "product/core/services.ts"],
  ["product/service-dependencies.ts", "product/core/service-dependencies.ts"],
  ["product/service-types.ts", "product/core/service-types.ts"],
  ["product/types.ts", "product/core/types.ts"],
  ["product/feature-flags.ts", "product/core/feature-flags.ts"],
  ["product/audit-trail.ts", "product/core/audit-trail.ts"],
  ["product/observability.ts", "product/core/observability.ts"],
  ["product/observability-types.ts", "product/core/observability-types.ts"],
  ["product/ai-policy.ts", "product/ai-policy/ai-policy.ts"],
  ["product/safety-policy.ts", "product/safety-policy/safety-policy.ts"],
  ["product/usage-policy.ts", "product/usage/usage-policy.ts"],
  ...listFilesRecursive(srcRoot)
    .filter((file) => /^execution\/quality[^/]*\.ts$/.test(file))
    .map((file) => [file, `execution/quality/${file.slice("execution/".length)}`]),
  ["execution/pipeline-attempt.ts", "execution/pipeline/pipeline-attempt.ts"],
  ["execution/pipeline-attempt-types.ts", "execution/pipeline/pipeline-attempt-types.ts"],
  ["execution/pipeline-execution-adapter.ts", "execution/pipeline/pipeline-execution-adapter.ts"],
  ["execution/pipeline-language-gate.ts", "execution/pipeline/pipeline-language-gate.ts"],
  ["execution/pipeline-runtime-state.ts", "execution/pipeline/pipeline-runtime-state.ts"],
  ["execution/preview-correlation.ts", "execution/pipeline/preview-correlation.ts"],
  ["execution/prompt-domain-policy.ts", "execution/pipeline/prompt-domain-policy.ts"],
  ["execution/generation-runtime.ts", "execution/pipeline/generation-runtime.ts"],
  ["execution/execution-failure.ts", "execution/pipeline/execution-failure.ts"],
  ["execution/runtime-attempt-loop.ts", "execution/pipeline/runtime-attempt-loop.ts"],
  ["execution/step-context.ts", "execution/pipeline/step-context.ts"],
  ["execution/sanitized-generation-input.ts", "execution/pipeline/sanitized-generation-input.ts"],
  ["execution/trusted-snapshot.ts", "execution/pipeline/trusted-snapshot.ts"],
  ["execution/provider-transport.ts", "execution/pipeline/provider-transport.ts"]
];

const moveMap = new Map(MOVES.map(([from, to]) => [normalize(from), normalize(to)]));

function normalize(relativePath) {
  return relativePath.replace(/\\/g, "/");
}

function toTsPath(relativePath) {
  return join(srcRoot, relativePath.replace(/\.js$/, ".ts"));
}

function ensureParent(path) {
  mkdirSync(dirname(path), { recursive: true });
}

function applyMoves() {
  for (const [from, to] of MOVES) {
    const fromPath = join(srcRoot, from);
    const toPath = join(srcRoot, to);
    if (!existsSync(fromPath)) {
      console.warn(`skip missing: ${from}`);
      continue;
    }
    ensureParent(toPath);
    renameSync(fromPath, toPath);
    console.log(`moved ${from} -> ${to}`);
  }
}

function resolveRelativeImport(fromFile, spec) {
  if (!spec.startsWith(".")) {
    return null;
  }
  const fromDir = dirname(fromFile);
  const target = resolve(fromDir, spec);
  return target.endsWith(".js") ? target.slice(0, -3) + ".ts" : target + ".ts";
}

function rewriteSpec(fromFile, spec) {
  if (!spec.startsWith(".")) {
    return spec;
  }

  const resolved = resolveRelativeImport(fromFile, spec);
  if (!resolved || !resolved.startsWith(srcRoot)) {
    return spec;
  }

  const oldRelative = normalize(relative(srcRoot, resolved).replace(/\.ts$/, ""));
  const mapped = moveMap.get(oldRelative);
  if (!mapped) {
    return spec;
  }

  const newAbsolute = join(srcRoot, `${mapped}.ts`);
  let newRelative = relative(dirname(fromFile), newAbsolute).replace(/\\/g, "/");
  if (!newRelative.startsWith(".")) {
    newRelative = `./${newRelative}`;
  }
  return `${newRelative.replace(/\.ts$/, ".js")}`;
}

function rewriteFile(filePath) {
  const original = readFileSync(filePath, "utf8");
  const updated = original.replace(
    /(from|export)\s+["'](\.[^"']+)["']/g,
    (match, keyword, spec) => `${keyword} "${rewriteSpec(filePath, spec)}"`
  );
  if (updated !== original) {
    writeFileSync(filePath, updated);
  }
}

function rewriteImports() {
  const roots = [
    join(repoRoot, "apps/backend"),
    join(repoRoot, "tests"),
    join(repoRoot, "scripts")
  ];

  for (const root of roots) {
    for (const file of listFilesRecursive(root).filter((entry) => entry.endsWith(".ts") || entry.endsWith(".mjs") || entry.endsWith(".tsx"))) {
      rewriteFile(join(root, file));
    }
  }
}

applyMoves();
rewriteImports();
console.log("Backend src restructure complete.");
