import { createServer } from "node:http";
import { readFile, stat } from "node:fs/promises";
import { resolve, extname, sep } from "node:path";
const root = resolve(import.meta.dirname, ".."),
  port = Number(process.env.PORT ?? 4173);
const types = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".svg": "image/svg+xml",
  ".json": "application/json",
};
const server = createServer(async (req, res) => {
  try {
    const pathname = decodeURIComponent(
      new URL(req.url, "http://localhost").pathname,
    );
    const parts = pathname.split("/");
    if (
      parts.some(
        (p) =>
          p.startsWith(".") ||
          ["node_modules", "artifacts", "tests"].includes(p),
      )
    ) {
      res.writeHead(403);
      res.end();
      return;
    }
    let path = resolve(root, `.${pathname}`);
    if (path !== root && !path.startsWith(root + sep)) {
      res.writeHead(403);
      res.end();
      return;
    }
    if ((await stat(path)).isDirectory()) path = resolve(path, "index.html");
    if (!types[extname(path)]) {
      res.writeHead(404);
      res.end();
      return;
    }
    const body = await readFile(path);
    res.writeHead(200, {
      "Content-Type": types[extname(path)],
      "Cache-Control": "no-store",
      "X-Content-Type-Options": "nosniff",
    });
    res.end(body);
  } catch {
    res.writeHead(404);
    res.end("Not found");
  }
});
server.listen(port, "127.0.0.1", () =>
  console.log(`MaksTrener: http://127.0.0.1:${port}`),
);
