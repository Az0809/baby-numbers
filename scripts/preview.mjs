import { createReadStream, existsSync, statSync } from "node:fs";
import { createServer } from "node:http";
import { extname, join, normalize, resolve, sep } from "node:path";

const args = process.argv.slice(2);
const portIndex = args.indexOf("--port");
const requestedPort = Number(portIndex >= 0 ? args[portIndex + 1] : process.env.PORT || 4173);
const port = Number.isInteger(requestedPort) && requestedPort > 0 ? requestedPort : 4173;
const root = resolve(process.cwd(), "out");

if (!existsSync(root)) {
  console.error("未找到 out 目录，请先执行 npm run build");
  process.exit(1);
}

const contentTypes = {
  ".css": "text/css; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".ico": "image/x-icon",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".map": "application/json; charset=utf-8",
  ".png": "image/png",
  ".svg": "image/svg+xml; charset=utf-8",
  ".txt": "text/plain; charset=utf-8",
  ".webmanifest": "application/manifest+json; charset=utf-8",
  ".woff": "font/woff",
  ".woff2": "font/woff2"
};

createServer((request, response) => {
  let rawPath = "/";
  try {
    rawPath = decodeURIComponent((request.url || "/").split("?")[0]);
  } catch {
    response.writeHead(400, { "Content-Type": "text/plain; charset=utf-8" });
    response.end("Bad Request");
    return;
  }

  const safePath = normalize(rawPath).replace(/^(\.\.(\/|\\|$))+/, "");
  let filePath = join(root, safePath);
  let statusCode = 200;

  if (!filePath.startsWith(root + sep) && filePath !== root) {
    response.writeHead(403, { "Content-Type": "text/plain; charset=utf-8" });
    response.end("Forbidden");
    return;
  }

  if (existsSync(filePath) && statSync(filePath).isDirectory()) {
    filePath = join(filePath, "index.html");
  } else if (!existsSync(filePath) && !extname(filePath)) {
    filePath = join(filePath, "index.html");
  }

  if (!existsSync(filePath) || !statSync(filePath).isFile()) {
    filePath = join(root, "404.html");
    statusCode = 404;
  }

  if (!existsSync(filePath)) {
    response.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
    response.end("Not Found");
    return;
  }

  response.writeHead(statusCode, {
    "Content-Type": contentTypes[extname(filePath)] || "application/octet-stream",
    "Cache-Control": filePath.endsWith("sw.js")
      ? "no-cache, no-store, must-revalidate"
      : "public, max-age=0, must-revalidate"
  });
  createReadStream(filePath).pipe(response);
}).listen(port, "127.0.0.1", () => {
  console.log(`预览地址：http://127.0.0.1:${port}`);
});
