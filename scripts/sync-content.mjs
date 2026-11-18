// Copies lab guides from a local darkterminal-labs checkout into content/labs/.
// Usage: node scripts/sync-content.mjs ../darkterminal-labs
import { readdir, readFile, writeFile, mkdir } from "node:fs/promises";
import path from "node:path";

const src = path.resolve(process.argv[2] ?? "../darkterminal-labs");
const dest = path.resolve("content/labs");
await mkdir(dest, { recursive: true });

const dirs = (await readdir(path.join(src, "labs"), { withFileTypes: true }))
  .filter((d) => d.isDirectory())
  .map((d) => d.name)
  .sort();

for (const dir of dirs) {
  const body = await readFile(path.join(src, "labs", dir, "README.md"), "utf8");
  await writeFile(path.join(dest, `${dir}.md`), body);
  console.log(`synced ${dir}`);
}
