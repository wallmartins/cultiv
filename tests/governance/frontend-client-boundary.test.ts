import { describe, expect, it } from "vitest";
import { readdir, readFile, stat } from "node:fs/promises";
import path from "node:path";

const FRONTEND_APPS = ["apps/web", "apps/mobile"] as const;
const FORBIDDEN_HTTP_IMPORTS = [/\bfetch\s*\(/, /\bfrom\s+["']axios["']/, /\bfrom\s+["']ky["']/];
const FORBIDDEN_BACKEND_ROUTE_PATTERNS = [/\/api\/pipelines/, /\/api\/jobs/, /\/me\/executions/];
const IGNORED_DIRECTORIES = new Set(["node_modules", ".output", "dist", ".nitro"]);
const SERVER_ONLY_PATH_SEGMENTS = ["/platform/server/", "/platform/services/", "/routes/api/"] as const;

function isServerOnlySourceFile(file: string): boolean {
  const normalized = file.replaceAll("\\", "/");
  return SERVER_ONLY_PATH_SEGMENTS.some((segment) => normalized.includes(segment));
}

async function listSourceFiles(directory: string): Promise<string[]> {
  const entries = await readdir(directory).catch(() => [] as string[]);
  const files: string[] = [];

  for (const entry of entries) {
    if (IGNORED_DIRECTORIES.has(entry)) {
      continue;
    }

    const fullPath = path.join(directory, entry);
    const entryStat = await stat(fullPath);
    if (entryStat.isDirectory()) {
      files.push(...(await listSourceFiles(fullPath)));
      continue;
    }

    if (/\.(ts|tsx|js|jsx)$/.test(entry)) {
      files.push(fullPath);
    }
  }

  return files;
}

describe("frontend client boundary governance", () => {
  it("keeps frontend apps from calling backend routes directly once source files exist", async () => {
    for (const appDir of FRONTEND_APPS) {
      const files = await listSourceFiles(path.join(appDir, "src"));
      for (const file of files) {
        if (isServerOnlySourceFile(file)) {
          continue;
        }

        const source = await readFile(file, "utf8");

        for (const pattern of FORBIDDEN_HTTP_IMPORTS) {
          expect(source, `${file} must not call HTTP clients directly`).not.toMatch(pattern);
        }

        for (const pattern of FORBIDDEN_BACKEND_ROUTE_PATTERNS) {
          expect(source, `${file} must not embed backend route strings`).not.toMatch(pattern);
        }
      }
    }
  });

  it("documents the approved client integration package for frontend apps", async () => {
    for (const appDir of FRONTEND_APPS) {
      const packageJsonPath = path.join(appDir, "package.json");
      const packageJson = await readFile(packageJsonPath, "utf8").catch(() => null);
      if (!packageJson) {
        continue;
      }

      const sourceFiles = await listSourceFiles(path.join(appDir, "src"));
      const usesClientSdk = await Promise.all(
        sourceFiles.map(async (file) => {
          const source = await readFile(file, "utf8");
          return source.includes("@my-ai-orchestrator/client-sdk");
        })
      ).then((matches) => matches.some(Boolean));

      if (!usesClientSdk) {
        continue;
      }

      const parsed = JSON.parse(packageJson) as { dependencies?: Record<string, string> };
      expect(parsed.dependencies?.["@my-ai-orchestrator/client-sdk"]).toBeDefined();
    }
  });
});
