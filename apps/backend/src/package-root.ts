import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

export const backendPackageRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
