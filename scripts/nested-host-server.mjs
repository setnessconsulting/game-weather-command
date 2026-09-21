import { createReadStream, existsSync, statSync } from "node:fs";
import { createServer } from "node:http";
import { extname, join, normalize, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(fileURLToPath(new URL("..", import.meta.url)));
const dist = join(root, "dist");
const prefix = "/game-assets/weather-command/test-foundation/";
const port = Number(process.env.WC_HOST_PORT ?? 4174);
const types = { ".html": "text/html; charset=utf-8", ".js": "text/javascript; charset=utf-8", ".css": "text/css; charset=utf-8", ".svg": "image/svg+xml" };

createServer((req, res) => {
  const pathname = new URL(req.url ?? "/", "http://localhost").pathname;
  if (!pathname.startsWith(prefix)) { res.writeHead(404); res.end("Not found"); return; }
  const relativePath = pathname.slice(prefix.length) || "index.html";
  const path = normalize(join(dist, relativePath));
  if (!path.startsWith(dist) || !existsSync(path) || statSync(path).isDirectory()) { res.writeHead(404); res.end("Not found"); return; }
  res.writeHead(200, { "content-type": types[extname(path)] ?? "application/octet-stream" });
  createReadStream(path).pipe(res);
}).listen(port, "127.0.0.1", () => {
  console.log("Nested Weather Command fixture at http://127.0.0.1:" + port + prefix);
});
