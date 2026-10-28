import { readFile, writeFile, readdir } from "node:fs/promises";
import { resolve } from "node:path";

// Development-only release helper. Imported ES modules need cache versions too.
const version = process.argv[2];
if (!/^\d+\.\d+\.\d+$/.test(version ?? "")) {
  console.error("Usage: node scripts/version-assets.js MAJOR.MINOR.PATCH");
  process.exit(1);
}
const root = resolve(import.meta.dirname, "..");
async function updateModules(directory) {
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const path = resolve(directory, entry.name);
    if (entry.isDirectory()) await updateModules(path);
    else if (entry.name.endsWith(".js")) {
      const source = await readFile(path, "utf8");
      await writeFile(
        path,
        source.replace(
          /(from\s+["'])(\.{1,2}\/[^"'?]+\.js)(?:\?v=[\d.]+)?(["'])/g,
          `$1$2?v=${version}$3`,
        ),
      );
    }
  }
}
await updateModules(resolve(root, "js"));
const pkgPath = resolve(root, "package.json");
const pkg = JSON.parse(await readFile(pkgPath, "utf8"));
pkg.version = version;
await writeFile(pkgPath, JSON.stringify(pkg, null, 2) + "\n");
const entryPath = resolve(root, "index.html");
await writeFile(
  entryPath,
  (await readFile(entryPath, "utf8")).replace(/\?v=[\d.]+/g, `?v=${version}`),
);
const runPath = resolve(root, "js/engine/run.js");
await writeFile(
  runPath,
  (await readFile(runPath, "utf8")).replace(
    /APP_VERSION = "[\d.]+"/,
    `APP_VERSION = "${version}"`,
  ),
);
console.log(`Versioned application assets: ${version}`);
