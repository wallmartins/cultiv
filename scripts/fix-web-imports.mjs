#!/usr/bin/env node
/**
 * Repair ~/ and relative imports after web src restructure.
 * Run from repository root: node scripts/fix-web-imports.mjs
 */
import { existsSync, readFileSync, readdirSync, statSync, writeFileSync } from "node:fs";
import { dirname, join, relative, resolve } from "node:path";

const repoRoot = resolve(import.meta.dirname, "..");
const srcRoot = join(repoRoot, "apps/web/src");
const scanRoots = [
  srcRoot,
  join(repoRoot, "tests/web"),
  join(repoRoot, "tests/governance")
];

function listFilesRecursive(dir, prefix = "") {
  if (!existsSync(dir)) {
    return [];
  }
  const entries = readdirSync(dir);
  /** @type {string[]} */
  const files = [];
  for (const entry of entries) {
    if (entry === "node_modules" || entry === ".output" || entry === "dist" || entry === ".nitro") {
      continue;
    }
    const fullPath = join(dir, entry);
    const relativePath = prefix ? `${prefix}/${entry}` : entry;
    if (statSync(fullPath).isDirectory()) {
      files.push(...listFilesRecursive(fullPath, relativePath));
      continue;
    }
    if (/\.(ts|tsx|mjs)$/.test(entry)) {
      files.push(fullPath);
    }
  }
  return files;
}

function listModulePaths(dir, prefix = "") {
  const entries = readdirSync(dir);
  /** @type {string[]} */
  const modules = [];
  for (const entry of entries) {
    if (entry === "node_modules" || entry === ".output" || entry === "routeTree.gen.ts") {
      continue;
    }
    const fullPath = join(dir, entry);
    const relativePath = prefix ? `${prefix}/${entry}` : entry;
    if (statSync(fullPath).isDirectory()) {
      modules.push(...listModulePaths(fullPath, relativePath));
      continue;
    }
    if (/\.(ts|tsx)$/.test(entry)) {
      modules.push(relativePath.replace(/\.(ts|tsx)$/, ""));
    }
  }
  return modules;
}

const modulePaths = listModulePaths(srcRoot);
const moduleBySuffix = new Map();
for (const modulePath of modulePaths) {
  moduleBySuffix.set(modulePath, modulePath);
  const base = modulePath.split("/").pop();
  if (base && !moduleBySuffix.has(base)) {
    moduleBySuffix.set(base, modulePath);
  }
}

/** @type {readonly (readonly [string, string])[]} */
const TILDE_REPLACEMENTS = [
  ["~/components/app-shell/", "~/app/shell/"],
  ["~/components/generation/GenerationScreen", "~/app/generation/screens/GenerationScreen"],
  ["~/components/generation/BriefingForm", "~/app/generation/components/BriefingForm"],
  ["~/components/generation/QualityModeHelpContent", "~/app/generation/components/QualityModeHelpContent"],
  ["~/components/history/ExecutionHistoryScreen", "~/app/history/screens/ExecutionHistoryScreen"],
  ["~/components/history/ExecutionHistoryDetail", "~/app/history/screens/ExecutionHistoryDetail"],
  ["~/components/settings/SettingsScreen", "~/app/settings/screens/SettingsScreen"],
  ["~/components/onboarding/OnboardingFlow", "~/app/onboarding/screens/OnboardingFlow"],
  ["~/components/voice/", "~/app/voice/components/"],
  ["~/components/execution/", "~/app/execution/components/"],
  ["~/components/app/", "~/app/auth/components/"],
  ["~/components/ui/", "~/platform/ui/"],
  ["~/components/notifications/", "~/platform/notifications/"],
  ["~/components/DefaultCatchBoundary", "~/platform/components/DefaultCatchBoundary"],
  ["~/components/NotFound", "~/platform/components/NotFound"],
  ["~/components/differentiators/", "~/marketing/components/differentiators/"],
  ["~/layouts/MarketingLayout", "~/marketing/layouts/MarketingLayout"],
  ["~/layouts/AppLayout", "~/app/layouts/AppLayout"],
  ["~/layouts/OnboardingLayout", "~/app/layouts/OnboardingLayout"],
  ["~/sections/", "~/marketing/sections/"],
  ["~/visual/", "~/marketing/visual/"],
  ["~/animations/", "~/marketing/animations/"],
  ["~/content/", "~/marketing/content/"],
  ["~/navigation/", "~/marketing/navigation/"],
  ["~/utils/geo/", "~/marketing/seo/geo/"],
  ["~/utils/resolve-page-head", "~/marketing/seo/resolve-page-head"],
  ["~/utils/resolve-page-seo", "~/marketing/seo/resolve-page-seo"],
  ["~/utils/og-image", "~/marketing/seo/og-image"],
  ["~/utils/site-url", "~/marketing/seo/site-url"],
  ["~/utils/seo", "~/marketing/seo/seo"],
  ["~/lib/runtime/", "~/platform/runtime/"],
  ["~/lib/sdk/", "~/platform/sdk/"],
  ["~/lib/notifications/", "~/platform/notifications/"],
  ["~/lib/credits/", "~/platform/credits/"],
  ["~/lib/active-executions/", "~/platform/active-executions/"],
  ["~/lib/server/", "~/platform/server/"],
  ["~/lib/services/", "~/platform/services/"],
  ["~/lib/auth/", "~/app/auth/lib/"],
  ["~/lib/routing/", "~/app/auth/lib/"],
  ["~/lib/generation/", "~/app/generation/lib/"],
  ["~/lib/voice/", "~/app/voice/lib/"],
  ["~/lib/executions/", "~/app/history/lib/"],
  ["~/lib/execution/", "~/app/execution/lib/"],
  ["~/lib/onboarding/", "~/app/onboarding/lib/"],
  ["~/i18n/locales/", "~/i18n/marketing/locales/"],
  ["~/i18n/get-locale", "~/i18n/marketing/get-locale"],
  ["~/i18n/types", "~/i18n/marketing/types"]
];

const LOOSE_MARKETING_COMPONENTS = [
  "BelowFoldSections",
  "BrandMark",
  "DeferredAnalytics",
  "FullScreenSection",
  "GeoStructuredData",
  "JsonLd",
  "LegalDocumentPage",
  "LegalStructuredData",
  "LocaleToggle",
  "ProblemPerspectiveRow",
  "ProductShowcase",
  "ShowcaseBlogPostPreview",
  "ShowcaseLinkedInPostPreview",
  "ShowcaseProseOutput",
  "ShowcaseSampleOutput",
  "ShowcaseSlide",
  "ShowcaseThreadPosts",
  "ShowcaseVariantPanel",
  "SiteHeader",
  "SiteMobileNav",
  "SolutionBreathBeats",
  "SolutionBreathChip",
  "SolutionBreathScrolly",
  "ViewportBelowFoldSections",
  "VoiceRootTimeline",
  "WaitlistForm"
];

for (const name of LOOSE_MARKETING_COMPONENTS) {
  TILDE_REPLACEMENTS.push([`~/components/${name}`, `~/marketing/components/${name}`]);
}

/** @type {readonly (readonly [string, string])[]} */
const RELATIVE_PREFIX_REPLACEMENTS = [
  ["../../content/", "../../marketing/content/"],
  ["../content/", "../marketing/content/"],
  ["../../sections/", "../../marketing/sections/"],
  ["../sections/", "../marketing/sections/"],
  ["../../visual/", "../../marketing/visual/"],
  ["../visual/", "../marketing/visual/"],
  ["../../animations/", "../../marketing/animations/"],
  ["../animations/", "../marketing/animations/"],
  ["../../utils/", "../../marketing/seo/"],
  ["../utils/", "../marketing/seo/"],
  ["../../i18n/locales/", "../../i18n/marketing/locales/"],
  ["../i18n/locales/", "../i18n/marketing/locales/"],
  ["../../i18n/get-locale", "../../i18n/marketing/get-locale"],
  ["../i18n/get-locale", "../i18n/marketing/get-locale"],
  ["../../i18n/types", "../../i18n/marketing/types"],
  ["../i18n/types", "../i18n/marketing/types"],
  ["../../components/ui/", "../../platform/ui/"],
  ["../components/ui/", "../platform/ui/"],
  ["../../lib/server/", "../../platform/server/"],
  ["../lib/server/", "../platform/server/"],
  ["../../lib/services/", "../../platform/services/"],
  ["../lib/services/", "../platform/services/"],
  ["../../lib/sdk/", "../../platform/sdk/"],
  ["../lib/sdk/", "../platform/sdk/"],
  ["../../lib/runtime/", "../../platform/runtime/"],
  ["../lib/runtime/", "../platform/runtime/"],
  ["../../lib/auth/", "../../app/auth/lib/"],
  ["../lib/auth/", "../app/auth/lib/"],
  ["../../lib/generation/", "../../app/generation/lib/"],
  ["../lib/generation/", "../app/generation/lib/"],
  ["../../lib/voice/", "../../app/voice/lib/"],
  ["../lib/voice/", "../app/voice/lib/"],
  ["../../lib/execution/", "../../app/execution/lib/"],
  ["../lib/execution/", "../app/execution/lib/"],
  ["../../lib/executions/", "../../app/history/lib/"],
  ["../lib/executions/", "../app/history/lib/"],
  ["../../components/app-shell/", "../../app/shell/"],
  ["../components/app-shell/", "../app/shell/"],
  ["../../content/showcase/", "../../marketing/content/showcase/"],
  ["../content/showcase/", "../marketing/content/showcase/"],
  ["../../content/content-types/", "../../marketing/content/content-types/"],
  ["../content/content-types/", "../marketing/content/content-types/"],
  ["../../utils/geo/", "../../marketing/seo/geo/"],
  ["../utils/geo/", "../marketing/seo/geo/"]
];

/** @type {readonly (readonly [string, string])[]} */
const EXTERNAL_PATH_REPLACEMENTS = [
  ["apps/web/src/content/", "apps/web/src/marketing/content/"],
  ["apps/web/src/utils/geo/", "apps/web/src/marketing/seo/geo/"],
  ["apps/web/src/utils/resolve-page-head", "apps/web/src/marketing/seo/resolve-page-head"],
  ["apps/web/src/utils/resolve-page-seo", "apps/web/src/marketing/seo/resolve-page-seo"],
  ["apps/web/src/i18n/locales/", "apps/web/src/i18n/marketing/locales/"],
  ["apps/web/src/lib/services/", "apps/web/src/platform/services/"],
  ["apps/web/src/lib/sdk/", "apps/web/src/platform/sdk/"],
  ["apps/web/src/lib/execution/", "apps/web/src/app/execution/lib/"],
  ["apps/web/src/lib/voice/", "apps/web/src/app/voice/lib/"],
  ["apps/web/src/lib/auth/", "apps/web/src/app/auth/lib/"],
  ["apps/web/src/lib/routing/", "apps/web/src/app/auth/lib/"],
  ["apps/web/src/components/app-shell/", "apps/web/src/app/shell/"],
  ["apps/web/src/components/ui/", "apps/web/src/platform/ui/"]
];

function applyReplacements(spec, replacements) {
  let next = spec;
  for (const [from, to] of replacements) {
    if (next.includes(from)) {
      next = next.split(from).join(to);
    }
  }
  return next;
}

function resolveModuleFile(modulePath) {
  const candidates = [
    join(srcRoot, `${modulePath}.ts`),
    join(srcRoot, `${modulePath}.tsx`),
    join(srcRoot, `${modulePath}/index.ts`),
    join(srcRoot, `${modulePath}/index.tsx`)
  ];
  return candidates.find((candidate) => existsSync(candidate)) ?? null;
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
  const suffixMatches = modulePaths.filter(
    (modulePath) => modulePath.endsWith(`/${normalized}`) || modulePath === normalized
  );
  if (suffixMatches.length === 1) {
    return suffixMatches[0];
  }
  return null;
}

function rewriteRelativeImport(fromFile, spec) {
  if (!spec.startsWith(".")) {
    return spec;
  }

  let next = applyReplacements(spec, RELATIVE_PREFIX_REPLACEMENTS);
  const fromDir = dirname(fromFile);
  const resolved = resolve(fromDir, next.replace(/\.js$/, ""));
  const resolvedFile =
    [`${resolved}.ts`, `${resolved}.tsx`, join(resolved, "index.ts"), join(resolved, "index.tsx")].find((candidate) =>
      existsSync(candidate)
    ) ?? null;

  if (resolvedFile) {
    return next;
  }

  const modulePath = findModule(next.replace(/^\.\//, "").replace(/\.js$/, ""));
  if (!modulePath) {
    return next;
  }

  const targetAbsolute = resolveModuleFile(modulePath);
  if (!targetAbsolute) {
    return next;
  }

  let relativePath = relative(fromDir, targetAbsolute).replace(/\\/g, "/");
  if (!relativePath.startsWith(".")) {
    relativePath = `./${relativePath}`;
  }
  return relativePath.replace(/\.tsx?$/, ".js");
}

function rewriteTildeImport(spec) {
  let next = applyReplacements(spec, TILDE_REPLACEMENTS);
  if (!next.startsWith("~/")) {
    return next;
  }

  const modulePath = next.slice(2).replace(/\.js$/, "");
  if (resolveModuleFile(modulePath)) {
    return next;
  }

  const resolved = findModule(modulePath);
  if (!resolved) {
    return next;
  }

  return `~/${resolved}.js`.replace(/\.tsx\.js$/, ".js").replace(/\.ts\.js$/, ".js");
}

function rewriteFile(filePath) {
  const original = readFileSync(filePath, "utf8");
  let updated = original;

  updated = updated.replace(/(from|export)\s+["'](~\/[^"']+)["']/g, (_match, keyword, spec) => {
    return `${keyword} "${rewriteTildeImport(spec)}"`;
  });

  updated = updated.replace(/(from|export)\s+["'](\.[^"']+)["']/g, (_match, keyword, spec) => {
    return `${keyword} "${rewriteRelativeImport(filePath, spec)}"`;
  });

  updated = updated.replace(/import\(\s*["'](~\/[^"']+)["']\s*\)/g, (_match, spec) => {
    return `import("${rewriteTildeImport(spec)}")`;
  });

  updated = updated.replace(/import\(\s*["'](\.[^"']+)["']\s*\)/g, (_match, spec) => {
    return `import("${rewriteRelativeImport(filePath, spec)}")`;
  });

  for (const [from, to] of EXTERNAL_PATH_REPLACEMENTS) {
    updated = updated.split(from).join(to);
  }

  if (updated !== original) {
    writeFileSync(filePath, updated);
    console.log(`updated ${relative(repoRoot, filePath)}`);
  }
}

for (const root of scanRoots) {
  for (const file of listFilesRecursive(root)) {
    rewriteFile(file);
  }
}

console.log("web import fix complete");
