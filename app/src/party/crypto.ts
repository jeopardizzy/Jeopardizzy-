/**
 * End-to-end encryption for party rooms. The host makes a random AES-GCM key
 * and shares it only inside the join link's #fragment, which browsers never
 * send to any server; the relay forwards ciphertext it cannot read.
 */

const subtle = () => {
  const s = globalThis.crypto?.subtle;
  if (!s) throw new Error("This page needs a secure (https) connection to play on several phones.");
  return s;
};

function toB64url(bytes: Uint8Array): string {
  let bin = "";
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function fromB64url(s: string): Uint8Array<ArrayBuffer> {
  const bin = atob(s.replace(/-/g, "+").replace(/_/g, "/"));
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

/** A fresh room key, and its text form for the join link. */
export async function newRoomKey(): Promise<{ key: CryptoKey; text: string }> {
  const raw = crypto.getRandomValues(new Uint8Array(16));
  return { key: await importRoomKey(toB64url(raw)), text: toB64url(raw) };
}

export async function importRoomKey(text: string): Promise<CryptoKey> {
  const raw = fromB64url(text);
  if (raw.length !== 16) throw new Error("bad room key");
  return subtle().importKey("raw", raw, "AES-GCM", false, ["encrypt", "decrypt"]);
}

/** Encrypt a message: base64url(12-byte IV ‖ ciphertext). */
export async function seal(key: CryptoKey, msg: unknown): Promise<string> {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const ct = new Uint8Array(
    await subtle().encrypt({ name: "AES-GCM", iv }, key, new TextEncoder().encode(JSON.stringify(msg))),
  );
  const out = new Uint8Array(iv.length + ct.length);
  out.set(iv);
  out.set(ct, iv.length);
  return toB64url(out);
}

/** Decrypt a message; null if it was tampered with or made with another key. */
export async function open(key: CryptoKey, data: string): Promise<unknown> {
  try {
    const bytes = fromB64url(data);
    const pt = await subtle().decrypt({ name: "AES-GCM", iv: bytes.slice(0, 12) }, key, bytes.slice(12));
    return JSON.parse(new TextDecoder().decode(pt));
  } catch {
    return null;
  }
}
