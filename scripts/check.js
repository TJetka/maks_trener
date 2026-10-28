import { readdir, readFile } from "node:fs/promises";
import { resolve, dirname } from "node:path";
import { spawnSync } from "node:child_process";
const root = resolve(import.meta.dirname, "..");
async function walk(dir) {
  return (
    await Promise.all(
      (await readdir(dir, { withFileTypes: true })).map((e) =>
        e.isDirectory() ? walk(resolve(dir, e.name)) : [resolve(dir, e.name)],
      ),
    )
  ).flat();
}
const files = [
  ...(await walk(resolve(root, "js"))),
  ...(await walk(resolve(root, "scripts"))),
  ...(await walk(resolve(root, "tests"))),
].filter((f) => f.endsWith(".js"));
let failures = 0;
for (const file of files) {
  const check = spawnSync(process.execPath, ["--check", file], {
    encoding: "utf8",
  });
  if (check.status) {
    console.error(check.stderr);
    failures++;
  }
  const source = await readFile(file, "utf8");
  for (const match of source.matchAll(/(?:from\s*|import\s*)['"]([^'"]+)['"]/g))
    if (match[1].startsWith(".")) {
      try {
        await readFile(resolve(dirname(file), match[1].split("?")[0]));
      } catch {
        console.error(`Missing import in ${file}: ${match[1]}`);
        failures++;
      }
    }
}
console.log(`Checked ${files.length} JavaScript files: ${failures} errors.`);
process.exitCode = failures ? 1 : 0;
