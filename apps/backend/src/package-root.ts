import { existsSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const currentDir = dirname(fileURLToPath(import.meta.url));

let root = resolve(currentDir, "..");
let depth = 0;
while (!existsSync(resolve(root, "package.json")) && depth < 5) {
  root = resolve(root, "..");
  depth++;
}

export const backendPackageRoot = root;
