#!/usr/bin/env node
import { existsSync, readFileSync, readdirSync, statSync, writeFileSync } from "node:fs";
import { dirname, join, relative, resolve } from "node:path";

const repoRoot = resolve(import.meta.dirname, "..");
const srcRoot = join(repoRoot, "apps/backend/src");
const roots = [
  join(repoRoot, "apps/backend"),
  join(repoRoot, "tests"),
  join(repoRoot, "scripts")
];

function listFilesRecursive(dir, prefix = "") {
  const entries = readdirSync(dir);
  /** @type {string[]} */
  const files = [];
  for (const entry of entries) {
    if (entry === "node_modules" || entry === "dist") {
      continue;
    }
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

const moduleFiles = listFilesRecursive(srcRoot)
  .filter((file) => file.endsWith(".ts"))
  .map((file) => file.replace(/\.ts$/, ""));

const moduleBySuffix = new Map();
for (const modulePath of moduleFiles) {
  moduleBySuffix.set(modulePath, modulePath);
  const base = modulePath.split("/").pop();
  if (base && !moduleBySuffix.has(base)) {
    moduleBySuffix.set(base, modulePath);
  }
}

function resolveRelativeImport(fromFile, spec) {
  if (!spec.startsWith(".")) {
    return null;
  }
  const fromDir = dirname(fromFile);
  const target = resolve(fromDir, spec);
  const tsTarget = target.endsWith(".js") ? target.slice(0, -3) + ".ts" : `${target}.ts`;
  return tsTarget;
}

function findModule(spec) {
  const normalized = spec.replace(/^\.\//, "").replace(/\.js$/, "");
  if (moduleBySuffix.has(normalized)) {
    return moduleBySuffix.get(normalized);
  }

  const base = normalized.split("/").pop();
  if (base && moduleBySuffix.has(base)) {
    return moduleBySuffix.get(base);
  }

  const suffixMatches = moduleFiles.filter((modulePath) => modulePath.endsWith(`/${normalized}`) || modulePath === normalized);
  if (suffixMatches.length === 1) {
    return suffixMatches[0];
  }

  return null;
}

function rewriteSpec(fromFile, spec) {
  if (!spec.startsWith(".")) {
    return spec;
  }

  const resolved = resolveRelativeImport(fromFile, spec);
  if (resolved && existsSync(resolved)) {
    return spec;
  }

  const modulePath = findModule(spec);
  if (!modulePath) {
    return spec;
  }

  const targetAbsolute = join(srcRoot, `${modulePath}.ts`);
  let next = relative(dirname(fromFile), targetAbsolute).replace(/\\/g, "/");
  if (!next.startsWith(".")) {
    next = `./${next}`;
  }
  return next.replace(/\.ts$/, ".js");
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

for (const root of roots) {
  for (const file of listFilesRecursive(root)) {
    if (!file.endsWith(".ts") && !file.endsWith(".mjs") && !file.endsWith(".tsx")) {
      continue;
    }
    rewriteFile(join(root, file));
  }
}

console.log("Backend import repair complete.");
