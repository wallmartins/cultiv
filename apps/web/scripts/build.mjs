// Build mínimo do app autenticado (mid-recreation): por enquanto só publica o
// `public/` estático em `dist/`, que é o que a Vercel serve (ver vercel.json).
// Quando o app real (TanStack Start / Vite) nascer, troque este script pelo
// bundler e o `outputDirectory` no vercel.json — o resto do wiring já existe.
import { cpSync, mkdirSync, rmSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const dist = join(root, "dist");

rmSync(dist, { recursive: true, force: true });
mkdirSync(dist, { recursive: true });
cpSync(join(root, "public"), dist, { recursive: true });

console.log("web: dist/ gerado a partir de public/");
