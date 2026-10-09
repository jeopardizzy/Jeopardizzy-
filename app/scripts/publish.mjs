/** Publish the production build to the repository root.
 *
 * This repo is served by GitHub Pages in "deploy from branch" mode
 * (main / root), so the built app must live at the repository root.
 * This script wipes the previously published files and copies app/dist
 * into place. Run via `npm run publish` (from repo root or app/).
 */
import { cpSync, existsSync, rmSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const appRoot = join(dirname(fileURLToPath(import.meta.url)), "..");
const repoRoot = join(appRoot, "..");
const dist = join(appRoot, "dist");

if (!existsSync(join(dist, "index.html"))) {
  console.error("app/dist/index.html not found — run `npm run build` first.");
  process.exit(1);
}

for (const p of ["assets", "index.html"]) {
  rmSync(join(repoRoot, p), { recursive: true, force: true });
}
cpSync(dist, repoRoot, { recursive: true });
console.log("Published app/dist → repository root");
