import { execFileSync } from "node:child_process";
import { cpSync, existsSync, rmSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

// A landing e o /app vivem no MESMO domínio (www.cultiv.app): a landing serve a raiz e o SPA
// autenticado serve /app/*. Antes isso era um rewrite cross-domain pra um deploy separado, que
// ficou apontando pra uma aplicação que não é esta — resultado: /app/* servia outro app, sem
// Auth0, e o login nunca disparava. Buildar e embutir aqui remove esse deploy do caminho.
const scriptDir = dirname(fileURLToPath(import.meta.url));
const repoRoot = join(scriptDir, "..", "..", "..");
const webDist = join(repoRoot, "apps", "web", "dist");
const target = join(scriptDir, "..", "dist", "app");

execFileSync("pnpm", ["--filter", "@my-ai-orchestrator/web", "build"], {
  cwd: repoRoot,
  stdio: "inherit"
});

if (!existsSync(join(webDist, "index.html"))) {
  throw new Error(`web build produced no index.html at ${webDist}`);
}

rmSync(target, { recursive: true, force: true });
cpSync(webDist, target, { recursive: true });

console.log(`[bundle-app] /app servido a partir de ${target}`);
