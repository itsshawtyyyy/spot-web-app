import { createReadStream, existsSync } from "node:fs";
import { createServer } from "node:http";
import { extname, join, normalize } from "node:path";

const root = join(import.meta.dirname, "dist");
const types = { ".css": "text/css", ".html": "text/html", ".jpg": "image/jpeg", ".js": "text/javascript", ".svg": "image/svg+xml" };

createServer((request, response) => {
  const pathname = new URL(request.url ?? "/", "http://localhost").pathname;
  const file = join(root, normalize(pathname).replace(/^([/\\])+/, "") || "index.html");
  const target = existsSync(file) ? file : join(root, "index.html");
  response.setHeader("Content-Type", types[extname(target)] ?? "application/octet-stream");
  createReadStream(target).pipe(response);
}).listen(3000, "127.0.0.1");
