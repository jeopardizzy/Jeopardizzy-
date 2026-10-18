import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

/** git facts for the version line (Guides); "dev" outside a git checkout */
function git(...args: string[]): string {
  try {
    return execFileSync("git", args, { stdio: ["ignore", "pipe", "ignore"] }).toString().trim();
  } catch {
    return "dev";
  }
}
const pkg = JSON.parse(readFileSync(new URL("./package.json", import.meta.url), "utf8")) as { version: string };

// base "./" makes the build work both at a root/custom domain and at
// https://<user>.github.io/<repository>/ — asset URLs stay relative.
export default defineConfig({
  base: "./",
  plugins: [react(), tailwindcss()],
  define: {
    __APP_VERSION__: JSON.stringify(pkg.version),
    // same number tools/ios_upload.sh uses as the iOS build number
    __APP_BUILD__: JSON.stringify(git("rev-list", "--count", "HEAD")),
    __APP_COMMIT__: JSON.stringify(git("rev-parse", "--short", "HEAD")),
  },
  build: {
    target: "es2022",
    chunkSizeWarningLimit: 900,
  },
});
