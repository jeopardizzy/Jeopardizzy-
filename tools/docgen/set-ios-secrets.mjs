import { readFileSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { execSync } from "node:child_process";
import sodium from "libsodium-wrappers";

/**
 * Uploads Apple signing material to GitHub Actions secrets.
 * Prepare a local folder (gitignored):
 *   signing-local/apple/dist.p12           — exported iOS Distribution certificate
 *   signing-local/apple/dist-password.txt  — the p12 export password
 *   signing-local/apple/app.mobileprovision — App Store profile for com.quizzicalclub.app
 *   signing-local/apple/team-id.txt        — your Apple Team ID (10 chars)
 * Run: node set-ios-secrets.mjs
 */
const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
const APPLE = join(ROOT, "signing-local", "apple");
const REPO = "jeopardizzy/Jeopardizzy-";

const TOKEN = execSync("git credential fill", { input: "protocol=https\nhost=github.com\n\n" })
  .toString().split("\n").find((l) => l.startsWith("password=")).slice(9).trim();
const H = { Authorization: `Bearer ${TOKEN}`, Accept: "application/vnd.github+json" };

const need = (rel) => {
  const p = join(APPLE, rel);
  if (!existsSync(p)) {
    console.error(`MISSING: signing-local/apple/${rel} — see docs/STORE_GUIDE.md for how to produce it.`);
    process.exit(1);
  }
  return p;
};

const secrets = {
  APPLE_CERTIFICATE_BASE64: readFileSync(need("dist.p12")).toString("base64"),
  APPLE_CERTIFICATE_PASSWORD: readFileSync(need("dist-password.txt"), "utf8").trim(),
  APPLE_PROVISIONING_PROFILE_BASE64: readFileSync(need("app.mobileprovision")).toString("base64"),
  APPLE_TEAM_ID: readFileSync(need("team-id.txt"), "utf8").trim(),
  IOS_KEYCHAIN_PASSWORD: Math.random().toString(36).slice(2) + Math.random().toString(36).slice(2),
};

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
  console.log(name.padEnd(38), res.status === 201 || res.status === 204 ? "SET" : `HTTP ${res.status}`);
}

for (const [name, value] of Object.entries(secrets)) await setSecret(name, value);

const vres = await fetch(`https://api.github.com/repos/${REPO}/actions/variables`, {
  method: "POST", headers: H,
  body: JSON.stringify({ name: "IOS_SIGNING_READY", value: "true" }),
});
console.log("IOS_SIGNING_READY".padEnd(38), vres.status === 201 ? "SET" : `HTTP ${vres.status}`);
console.log("\nDone. Next push to app/** (or manual dispatch of 'iOS build') produces a signed .ipa artifact.");
