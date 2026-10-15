import { readFileSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { execSync } from "node:child_process";
import sodium from "libsodium-wrappers";

/**
 * Uploads the Google Play service account JSON to GitHub Actions secrets.
 * Prepare (once, see docs/STORE_GUIDE.md):
 *   signing-local/play/service-account.json — JSON key of the service account
 *     linked to Play Console with "Release apps" permission.
 * Run: node set-play-secrets.mjs
 */
const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
const REPO = "jeopardizzy/Jeopardizzy-";

const TOKEN = execSync("git credential fill", { input: "protocol=https\nhost=github.com\n\n" })
  .toString().split("\n").find((l) => l.startsWith("password=")).slice(9).trim();
const H = { Authorization: `Bearer ${TOKEN}`, Accept: "application/vnd.github+json" };

const saPath = join(ROOT, "signing-local", "play", "service-account.json");
if (!existsSync(saPath)) {
  console.error("MISSING: signing-local/play/service-account.json — see docs/STORE_GUIDE.md");
  process.exit(1);
}
const saJson = readFileSync(saPath, "utf8");
// sanity: it must be a service account key
const parsed = JSON.parse(saJson);
if (parsed.type !== "service_account" || !parsed.private_key) {
  console.error("That JSON is not a service account key (expected type=service_account).");
  process.exit(1);
}

const pkRes = await fetch(`https://api.github.com/repos/${REPO}/actions/secrets/public-key`, { headers: H });
if (!pkRes.ok) { console.log("public-key fetch:", pkRes.status); process.exit(1); }
const pk = await pkRes.json();
await sodium.ready;

async function setSecret(name, value) {
  const pub = sodium.from_base64(pk.key, sodium.base64_variants.ORIGINAL);
  const sealed = sodium.crypto_box_seal(sodium.from_string(value), pub);
  const res = await fetch(`https://api.github.com/repos/${REPO}/actions/secrets/${name}`, {
    method: "PUT", headers: H,
    body: JSON.stringify({ encrypted_value: sodium.to_base64(sealed, sodium.base64_variants.ORIGINAL), key_id: pk.key_id }),
  });
  console.log(name.padEnd(30), res.status === 201 || res.status === 204 ? "SET" : `HTTP ${res.status}`);
}

await setSecret("PLAY_SERVICE_ACCOUNT_JSON", saJson);

const vres = await fetch(`https://api.github.com/repos/${REPO}/actions/variables`, {
  method: "POST", headers: H,
  body: JSON.stringify({ name: "PLAY_UPLOAD_READY", value: "true" }),
});
console.log("PLAY_UPLOAD_READY".padEnd(30), vres.status === 201 ? "SET" : `HTTP ${vres.status}`);
console.log("\nDone. Run the 'Upload to Google Play (internal)' workflow manually to ship the signed AAB.");
