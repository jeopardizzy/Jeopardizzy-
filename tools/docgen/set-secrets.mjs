import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
import { execSync } from "node:child_process";
import sodium from "libsodium-wrappers";

const TOKEN = execSync('git credential fill', { input: "protocol=https\nhost=github.com\n\n" })
  .toString().split("\n").find((l) => l.startsWith("password=")).slice(9).trim();
const REPO = "jeopardizzy/Jeopardizzy-";
const H = { Authorization: `Bearer ${TOKEN}`, Accept: "application/vnd.github+json" };

const creds = JSON.parse(readFileSync(join(ROOT, "signing-local", "credentials.json"), "utf8"));
const ksB64 = readFileSync(join(ROOT, "signing-local", "quizzical-upload.keystore")).toString("base64");

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
  console.log(name, "→", res.status === 201 || res.status === 204 ? "SET" : `HTTP ${res.status}`);
}

await setSecret("KEYSTORE_BASE64", ksB64);
await setSecret("KEYSTORE_PASSWORD", creds.store_password);
await setSecret("KEY_ALIAS", creds.alias);
await setSecret("KEY_PASSWORD", creds.key_password);

// repo variable flipping the signing steps on
const vres = await fetch(`https://api.github.com/repos/${REPO}/actions/variables`, {
  method: "POST", headers: H,
  body: JSON.stringify({ name: "ANDROID_SIGNING_READY", value: "true" }),
});
console.log("ANDROID_SIGNING_READY →", vres.status === 201 ? "SET" : `HTTP ${vres.status}`);
