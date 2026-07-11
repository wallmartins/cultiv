// Sincroniza os assets de marca de @my-ai-orchestrator/ui para o public/ da
// landing, antes de `dev` e `build` (ver package.json). Os arquivos copiados
// estão no .gitignore — a fonte canônica é o pacote; o App autenticado deve
// rodar o mesmo tipo de sync ao nascer.
import { cpSync } from "node:fs";
import { dirname, join } from "node:path";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";

const pub = join(dirname(fileURLToPath(import.meta.url)), "..", "public");
const require = createRequire(import.meta.url);
const assets = join(dirname(require.resolve("@my-ai-orchestrator/ui/package.json")), "assets");

// Favicons e manifest na raiz: browsers e o próprio site.webmanifest esperam
// esses caminhos fixos (/favicon.ico, /apple-touch-icon.png, /icon-192.png…).
cpSync(join(assets, "favicon"), pub, { recursive: true });
cpSync(join(assets, "site.webmanifest"), join(pub, "site.webmanifest"));
cpSync(join(assets, "og", "og-image.png"), join(pub, "og-image.png"));
// Logos completas públicas em /brand/ (compartilháveis por e-mail, imprensa etc.).
cpSync(join(assets, "svg"), join(pub, "brand"), { recursive: true });
