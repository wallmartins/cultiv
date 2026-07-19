import { cpSync, rmSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const publicDir = join(root, "public");
const appOutDir = join(root, "dist", "app");

rmSync(join(root, "dist"), { recursive: true, force: true });
mkdirSync(appOutDir, { recursive: true });
cpSync(publicDir, appOutDir, { recursive: true });

console.log("web build: public/ → dist/app/");
