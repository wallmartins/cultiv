// Servidor estático de desenvolvimento, zero dependências (http nativo do Node).
// Serve `public/` sob http://localhost:4321/app — espelha o proxy de produção
// (a landing faz rewrite de `/app/*` para este deploy). Placeholder até o app real nascer.
import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { dirname, extname, join, normalize } from "node:path";
import { fileURLToPath } from "node:url";

const pub = join(dirname(fileURLToPath(import.meta.url)), "..", "public");
const port = Number(process.env.PORT ?? 4321);
const types = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".ico": "image/x-icon"
};

createServer(async (req, res) => {
  const url = new URL(req.url ?? "/", `http://localhost:${port}`);
  const path = url.pathname.replace(/^\/app/, "") || "/";
  const rel = path === "/" ? "/index.html" : path;
  const file = join(pub, normalize(rel).replace(/^(\.\.[/\\])+/, ""));
  try {
    const body = await readFile(file);
    res.writeHead(200, { "content-type": types[extname(file)] ?? "application/octet-stream" });
    res.end(body);
  } catch {
    res.writeHead(404, { "content-type": "text/html; charset=utf-8" });
    res.end(await readFile(join(pub, "index.html")).catch(() => "404"));
  }
}).listen(port, () => console.log(`web: http://localhost:${port}/app`));
