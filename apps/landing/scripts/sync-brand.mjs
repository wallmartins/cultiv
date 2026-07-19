import { cpSync } from "node:fs";
import { dirname, join } from "node:path";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";

const publicDir = join(dirname(fileURLToPath(import.meta.url)), "..", "public");
const require = createRequire(import.meta.url);
const uiAssets = join(dirname(require.resolve("@my-ai-orchestrator/ui/package.json")), "assets");

const isBuildScript = (path) => /\.(mjs|md)$/.test(path);

cpSync(join(uiAssets, "favicon"), publicDir, {
  recursive: true,
  filter: (path) => !isBuildScript(path),
});
cpSync(join(uiAssets, "site.webmanifest"), join(publicDir, "site.webmanifest"));
cpSync(join(uiAssets, "og", "og-image.png"), join(publicDir, "og-image.png"));
cpSync(join(uiAssets, "svg"), join(publicDir, "brand"), { recursive: true });
