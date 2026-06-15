#!/usr/bin/env node
/**
 * One-shot web src layout migration.
 * Run from repository root: node scripts/restructure-web-src.mjs
 */
import { existsSync, mkdirSync, readdirSync, renameSync, rmSync, statSync } from "node:fs";
import { dirname, join, resolve } from "node:path";

const repoRoot = resolve(import.meta.dirname, "..");
const srcRoot = join(repoRoot, "apps/web/src");

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

function moveDir(prefix, targetPrefix) {
  const files = listFilesRecursive(srcRoot).filter((file) => file === prefix || file.startsWith(`${prefix}/`));
  for (const file of files) {
    const rest = file === prefix ? "" : file.slice(prefix.length + 1);
    const target = rest ? `${targetPrefix}/${rest}` : targetPrefix;
    moves.push([file, target]);
  }
}

/** @type {Array<[string, string]>} */
const moves = [
  ["layouts/MarketingLayout.tsx", "marketing/layouts/MarketingLayout.tsx"],
  ["layouts/AppLayout.tsx", "app/layouts/AppLayout.tsx"],
  ["layouts/OnboardingLayout.tsx", "app/layouts/OnboardingLayout.tsx"],
  ["utils/seo.ts", "marketing/seo/seo.ts"],
  ["utils/resolve-page-head.ts", "marketing/seo/resolve-page-head.ts"],
  ["utils/resolve-page-seo.ts", "marketing/seo/resolve-page-seo.ts"],
  ["utils/og-image.ts", "marketing/seo/og-image.ts"],
  ["utils/site-url.ts", "marketing/seo/site-url.ts"],
  ["lib/routing/is-onboarding-route.ts", "app/auth/lib/is-onboarding-route.ts"],
  ["components/generation/GenerationScreen.tsx", "app/generation/screens/GenerationScreen.tsx"],
  ["components/generation/BriefingForm.tsx", "app/generation/components/BriefingForm.tsx"],
  ["components/generation/QualityModeHelpContent.tsx", "app/generation/components/QualityModeHelpContent.tsx"],
  ["components/history/ExecutionHistoryScreen.tsx", "app/history/screens/ExecutionHistoryScreen.tsx"],
  ["components/history/ExecutionHistoryDetail.tsx", "app/history/screens/ExecutionHistoryDetail.tsx"],
  ["components/settings/SettingsScreen.tsx", "app/settings/screens/SettingsScreen.tsx"],
  ["components/onboarding/OnboardingFlow.tsx", "app/onboarding/screens/OnboardingFlow.tsx"],
  ["components/notifications/NotificationHost.tsx", "platform/notifications/NotificationHost.tsx"],
  ["components/DefaultCatchBoundary.tsx", "platform/components/DefaultCatchBoundary.tsx"],
  ["components/NotFound.tsx", "platform/components/NotFound.tsx"],
  ["i18n/get-locale.ts", "i18n/marketing/get-locale.ts"],
  ["i18n/types.ts", "i18n/marketing/types.ts"],
  ["i18n/locales/en.ts", "i18n/marketing/locales/en.ts"],
  ["i18n/locales/pt.ts", "i18n/marketing/locales/pt.ts"],
  ...[
    "BelowFoldSections.tsx",
    "BrandMark.tsx",
    "DeferredAnalytics.tsx",
    "FullScreenSection.tsx",
    "GeoStructuredData.tsx",
    "JsonLd.tsx",
    "LegalDocumentPage.tsx",
    "LegalStructuredData.tsx",
    "LocaleToggle.tsx",
    "ProblemPerspectiveRow.tsx",
    "ProductShowcase.tsx",
    "ShowcaseBlogPostPreview.tsx",
    "ShowcaseLinkedInPostPreview.tsx",
    "ShowcaseProseOutput.tsx",
    "ShowcaseSampleOutput.tsx",
    "ShowcaseSlide.tsx",
    "ShowcaseThreadPosts.tsx",
    "ShowcaseVariantPanel.tsx",
    "SiteHeader.tsx",
    "SiteMobileNav.tsx",
    "SolutionBreathBeats.tsx",
    "SolutionBreathChip.tsx",
    "SolutionBreathScrolly.tsx",
    "ViewportBelowFoldSections.tsx",
    "VoiceRootTimeline.tsx",
    "WaitlistForm.tsx"
  ].map((name) => [`components/${name}`, `marketing/components/${name}`])
];

moveDir("sections", "marketing/sections");
moveDir("visual", "marketing/visual");
moveDir("animations", "marketing/animations");
moveDir("content", "marketing/content");
moveDir("navigation", "marketing/navigation");
moveDir("utils/geo", "marketing/seo/geo");
moveDir("components/differentiators", "marketing/components/differentiators");
moveDir("components/app-shell", "app/shell");
moveDir("components/app", "app/auth/components");
moveDir("components/voice", "app/voice/components");
moveDir("components/execution", "app/execution/components");
moveDir("lib/auth", "app/auth/lib");
moveDir("lib/generation", "app/generation/lib");
moveDir("lib/voice", "app/voice/lib");
moveDir("lib/executions", "app/history/lib");
moveDir("lib/execution", "app/execution/lib");
moveDir("lib/onboarding", "app/onboarding/lib");
moveDir("lib/runtime", "platform/runtime");
moveDir("lib/sdk", "platform/sdk");
moveDir("lib/notifications", "platform/notifications");
moveDir("lib/credits", "platform/credits");
moveDir("lib/active-executions", "platform/active-executions");
moveDir("lib/server", "platform/server");
moveDir("lib/services", "platform/services");
moveDir("components/ui", "platform/ui");

function ensureParent(filePath) {
  mkdirSync(dirname(filePath), { recursive: true });
}

const sortedMoves = [...moves].sort((left, right) => right[0].length - left[0].length);

for (const [from, to] of sortedMoves) {
  const fromPath = join(srcRoot, from);
  const toPath = join(srcRoot, to);
  if (!existsSync(fromPath)) {
    console.warn(`skip missing: ${from}`);
    continue;
  }
  if (existsSync(toPath)) {
    console.warn(`skip exists: ${to}`);
    continue;
  }
  ensureParent(toPath);
  renameSync(fromPath, toPath);
  console.log(`${from} -> ${to}`);
}

function removeEmptyDirs(dir) {
  if (!existsSync(dir) || dir === srcRoot) {
    return;
  }
  for (const entry of readdirSync(dir)) {
    const fullPath = join(dir, entry);
    if (statSync(fullPath).isDirectory()) {
      removeEmptyDirs(fullPath);
    }
  }
  if (readdirSync(dir).length === 0) {
    rmSync(dir, { recursive: true });
  }
}

for (const dirName of [
  "sections",
  "visual",
  "animations",
  "content",
  "navigation",
  "utils",
  "layouts",
  "components",
  "lib",
  "i18n/locales"
]) {
  removeEmptyDirs(join(srcRoot, dirName));
}

console.log("web restructure complete");
