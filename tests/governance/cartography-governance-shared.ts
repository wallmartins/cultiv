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
  { name: "PressMark", pattern: /PressMark/ },
  { name: "press-mark-geometry", pattern: /press-mark-geometry/ },
  { name: "imprint-grain", pattern: /imprint-grain/ },
  { name: "press-edge", pattern: /press-edge/ },
  { name: "InkBleed", pattern: /InkBleed/ },
  { name: "Bricolage Grotesque", pattern: /Bricolage Grotesque/ },
  { name: "Fraunces", pattern: /Fraunces/ },
  { name: "Source Serif 4", pattern: /Source Serif 4/ },
  { name: "data-intensity=", pattern: /data-intensity=/ },
  { name: "BotanicalTree", pattern: /BotanicalTree/ },
  { name: "BotanicalStem", pattern: /BotanicalStem/ },
  { name: "FallingLeavesLayer", pattern: /FallingLeavesLayer/ }
] as const;

export const WORKSPACE_BLUR_PATTERN = /backdrop-blur/;
export const WORKSPACE_RADIUS_PATTERN = /rounded-(2xl|xl|3xl)/;
export const WORKSPACE_GRADIENT_PATTERN = /bg-gradient/;

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

export function collectImprintBannedViolations(): string[] {
  const files = SCAN_ROOTS.flatMap((root) => listSourceFiles(join(ROOT, root)));
  const violations: string[] = [];

  for (const file of files) {
    const content = readFileSync(file, "utf8");

    for (const rule of IMPRINT_BANNED_PATTERNS) {
      if (rule.pattern.test(content)) {
        violations.push(`${relative(ROOT, file)}: ${rule.name}`);
      }
    }
  }

  return violations.sort();
}
