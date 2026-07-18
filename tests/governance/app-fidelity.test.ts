import { readFile, readdir } from "node:fs/promises";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { ROOT } from "./shared.js";

const UI_APP_ROOT = resolve(ROOT, "packages", "ui", "app");
const PRIMITIVES_ROOT = resolve(UI_APP_ROOT, "primitives");

async function listTsxFiles(dir: string): Promise<string[]> {
  const entries = await readdir(dir, { withFileTypes: true });
  const files: string[] = [];

  for (const entry of entries) {
    const fullPath = resolve(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await listTsxFiles(fullPath)));
      continue;
    }

    if (entry.isFile() && fullPath.endsWith(".tsx")) {
      files.push(fullPath);
    }
  }

  return files;
}

// Matches a real oklch()/hex/rgba() color literal — var(--token) and color-mix(in oklch, …)
// never produce these substrings themselves, so no extra "outside var()" parsing is needed.
const RAW_COLOR_PATTERN = /oklch\(|#[0-9a-fA-F]{3,8}\b|rgba?\(/;

const DEAD_TOKEN_NAMES_PATTERN = /\b(inkA|accentA|warningA)\b/;
// The bad shape from before the P2 conversion: `import { c, f } from "../primitives"`.
const DEAD_TOKEN_MODULE_IMPORT_PATTERN = /import\s*\{[^}]*\b[cf]\b[^}]*\}\s*from\s*["']\.\.?\/[^"']*primitives["']/;

const DATA_CTHEME_PATTERN = /data-ctheme/;

const TONE_TOKEN_PATTERN = /--danger|--warning/;
const TONE_CONTEXT_PATTERN = /fail|error|danger|delete|destructive|degrad|pending|timeout|warn/i;

describe("app-fidelity governance", () => {
  it("keeps packages/ui/app free of raw color literals outside var()/color-mix()", async () => {
    for (const filePath of await listTsxFiles(UI_APP_ROOT)) {
      const source = await readFile(filePath, "utf-8");
      expect(source, filePath).not.toMatch(RAW_COLOR_PATTERN);
    }
  });

  it("keeps packages/ui/app free of the dead c/f/inkA/accentA/warningA token module", async () => {
    for (const filePath of await listTsxFiles(UI_APP_ROOT)) {
      const source = await readFile(filePath, "utf-8");
      expect(source, filePath).not.toMatch(DEAD_TOKEN_NAMES_PATTERN);
      expect(source, filePath).not.toMatch(DEAD_TOKEN_MODULE_IMPORT_PATTERN);
    }
  });

  it("keeps theme switching on [data-theme], never data-ctheme", async () => {
    for (const filePath of await listTsxFiles(UI_APP_ROOT)) {
      const source = await readFile(filePath, "utf-8");
      expect(source, filePath).not.toMatch(DATA_CTHEME_PATTERN);
    }
  });

  it("keeps --danger/--warning out of decorative use", async () => {
    for (const filePath of await listTsxFiles(UI_APP_ROOT)) {
      // primitives/** is the tone→token mapping SSOT (Ring/StatusDot/Banner/Chip/Pill accept a
      // tone/variant prop) — consumers only ever reach --danger/--warning through them, so a
      // consumer file using the tokens directly must justify it by name (see TONE_CONTEXT_PATTERN).
      if (filePath.startsWith(PRIMITIVES_ROOT)) {
        continue;
      }

      const source = await readFile(filePath, "utf-8");
      if (TONE_TOKEN_PATTERN.test(source)) {
        expect(filePath).toMatch(TONE_CONTEXT_PATTERN);
      }
    }
  });
});
