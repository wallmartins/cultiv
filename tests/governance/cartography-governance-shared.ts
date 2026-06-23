import { readFileSync, readdirSync, statSync, existsSync } from "node:fs";
import { join, relative } from "node:path";

export const ROOT = process.cwd();

export const SCAN_ROOTS = ["packages/ui/src", "apps/web/src"] as const;
export const SCAN_EXTENSIONS = new Set([".ts", ".tsx", ".css"]);
export const WORKSPACE_DIR = "apps/web/src/app";

export const THEME_CSS_PATH = "packages/ui/src/styles/theme.css";
export const UI_INDEX_PATH = "packages/ui/src/index.ts";

export const CARTOGRAPHY_REQUIRED_IN_THEME = [
  /--color-deep-blue/,
  /--font-autoridade/,
  /\.cartography-grain/
] as const;

export const CARTOGRAPHY_PRIMITIVE_FILES = [
  "packages/ui/src/primitives/CompassMark.tsx",
  "packages/ui/src/primitives/compass-mark-geometry.ts",
  "packages/ui/src/primitives/CartographySurface.tsx",
  "packages/ui/src/primitives/RouteLine.tsx",
  "packages/ui/src/primitives/CoordinateLabel.tsx",
  "packages/ui/src/primitives/ExpeditionCard.tsx",
  "packages/ui/src/primitives/LogbookProse.tsx",
  "packages/ui/src/primitives/icons/cartography-icons.tsx"
] as const;

export const CARTOGRAPHY_INDEX_EXPORTS = [
  "CompassMark",
  "CartographySurface",
  "RouteLine",
  "CoordinateLabel",
  "ExpeditionCard",
  "LogbookProse",
  "IconCompass"
] as const;

export const IMPRINT_BANNED_PATTERNS = [
  { name: "PressMark", pattern: /PressMark/, allowInIndexTs: true },
  { name: "press-mark-geometry", pattern: /press-mark-geometry/, allowInIndexTs: true },
  { name: "imprint-grain", pattern: /imprint-grain/, allowInThemeCss: true },
  { name: "press-edge", pattern: /press-edge/, allowInThemeCss: true },
  { name: "InkBleed", pattern: /InkBleed/, allowInIndexTs: true },
  { name: "Bricolage Grotesque", pattern: /Bricolage Grotesque/ },
  { name: "Fraunces", pattern: /Fraunces/, allowInThemeMigrationBlock: true },
  { name: "Source Serif 4", pattern: /Source Serif 4/, allowInThemeMigrationBlock: true },
  { name: "data-intensity=", pattern: /data-intensity=/, allowInThemeCss: true },
  { name: "BotanicalTree", pattern: /BotanicalTree/ },
  { name: "BotanicalStem", pattern: /BotanicalStem/ },
  { name: "FallingLeavesLayer", pattern: /FallingLeavesLayer/ }
] as const;

export const WORKSPACE_BLUR_PATTERN = /backdrop-blur/;
export const WORKSPACE_RADIUS_PATTERN = /rounded-(2xl|xl|3xl)/;
export const WORKSPACE_GRADIENT_PATTERN = /bg-gradient/;

const MIGRATION_ALIASES_MARKER = "migration aliases — remove Task 20";

export function listSourceFiles(directory: string): string[] {
  const files: string[] = [];

  for (const entry of readdirSync(directory)) {
    const fullPath = join(directory, entry);
    const entryStat = statSync(fullPath);

    if (entryStat.isDirectory()) {
      files.push(...listSourceFiles(fullPath));
      continue;
    }

    const extension = fullPath.slice(fullPath.lastIndexOf("."));
    if (SCAN_EXTENSIONS.has(extension)) {
      files.push(fullPath);
    }
  }

  return files;
}

export function readRepoFile(relativePath: string): string {
  return readFileSync(join(ROOT, relativePath), "utf8");
}

export function repoFileExists(relativePath: string): boolean {
  return existsSync(join(ROOT, relativePath));
}

export function stripThemeMigrationAliasesBlock(content: string): string {
  const markerIndex = content.indexOf(MIGRATION_ALIASES_MARKER);
  if (markerIndex === -1) {
    return content;
  }

  const pressEdgeIndex = content.indexOf("--shadow-press-edge:", markerIndex);
  if (pressEdgeIndex === -1) {
    return content.slice(0, markerIndex);
  }

  const blockEnd = content.indexOf(";", pressEdgeIndex);
  if (blockEnd === -1) {
    return content.slice(0, markerIndex);
  }

  return content.slice(0, markerIndex) + content.slice(blockEnd + 1);
}

export function contentForBannedPatternScan(
  filePath: string,
  content: string,
  rule: (typeof IMPRINT_BANNED_PATTERNS)[number]
): string | null {
  const relativePath = relative(ROOT, filePath).replace(/\\/g, "/");

  if (rule.allowInIndexTs && relativePath === UI_INDEX_PATH) {
    return null;
  }

  if (relativePath === THEME_CSS_PATH) {
    if (rule.allowInThemeCss) {
      return null;
    }

    if (rule.allowInThemeMigrationBlock) {
      return stripThemeMigrationAliasesBlock(content);
    }
  }

  return content;
}

export function collectImprintBannedViolations(): string[] {
  const files = SCAN_ROOTS.flatMap((root) => listSourceFiles(join(ROOT, root)));
  const violations: string[] = [];

  for (const file of files) {
    const content = readFileSync(file, "utf8");

    for (const rule of IMPRINT_BANNED_PATTERNS) {
      const scannable = contentForBannedPatternScan(file, content, rule);
      if (scannable === null) {
        continue;
      }

      if (rule.pattern.test(scannable)) {
        violations.push(`${relative(ROOT, file)}: ${rule.name}`);
      }
    }
  }

  return violations.sort();
}
