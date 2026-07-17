import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { join, dirname, extname } from "node:path";
import { fileURLToPath } from "node:url";

const publicDir = join(dirname(fileURLToPath(import.meta.url)), "..", "public");
const port = Number(process.env.PORT ?? 4321);
const contentTypes = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
  ".png": "image/png",
};

const serveIndex = async (res) => {
  const body = await readFile(join(publicDir, "index.html"));
  res.writeHead(200, { "content-type": contentTypes[".html"] });
  res.end(body);
};

createServer(async (req, res) => {
  const { pathname } = new URL(req.url, `http://localhost:${port}`);
  const underApp = pathname.replace(/^\/app/, "");
  if (underApp === "" || underApp === "/" || !extname(underApp)) return serveIndex(res);
  try {
    const body = await readFile(join(publicDir, underApp));
    res.writeHead(200, { "content-type": contentTypes[extname(underApp)] ?? "application/octet-stream" });
    res.end(body);
  } catch {
    await serveIndex(res);
  }
}).listen(port, () => console.log(`web dev: http://localhost:${port}/app`));
