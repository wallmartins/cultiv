// Build mínimo do app autenticado (mid-recreation): por enquanto só publica o
// `public/` estático em `dist/app/`, que é o que a Vercel serve (ver vercel.json).
// Tudo vive sob `/app` porque a landing faz proxy de `/app/*` para este deploy
// (ver apps/landing/vercel.json) — servir na raiz faria os assets do futuro SPA
// vazarem para a zona da landing. Quando o app real (TanStack Start / Vite)
// nascer, troque este script pelo bundler (base `/app`) — o resto do wiring já existe.
import { cpSync, mkdirSync, rmSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const dist = join(root, "dist");

rmSync(dist, { recursive: true, force: true });
mkdirSync(join(dist, "app"), { recursive: true });
cpSync(join(root, "public"), join(dist, "app"), { recursive: true });

console.log("web: dist/app/ gerado a partir de public/");
