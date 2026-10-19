// Party relay on Cloudflare Workers (prototype).
//   npm run dev      → local, ws://localhost:8787/ws (same port as server.ts)
//   npm run deploy   → needs a Cloudflare account; not deployed yet
//
// One Durable Object runs the same RelayHub as the local server, so every
// room lives in one place with one clock (fair buzz order). It keeps rooms in
// memory only, stores nothing and logs no message contents. Sockets use plain
// accept() rather than hibernation, because a hibernated object would forget
// its rooms; shard by room code if one object ever gets too busy.
import { MAX_DATA, RelayHub, type Conn } from "../src/party/relayCore";

interface Env {
  RELAY: DurableObjectNamespace;
}

const SWEEP_MS = 60_000;

/** Join links (https://<relay>/join#CODE/KEY) open the app when it's installed… */
const APPLE_APP_ID = "5CT93Q4J94.com.quizzicalclub.app";
const ANDROID_PACKAGE = "com.quizzicalclub.app";
/** Play App Signing certificate (from .github/workflows/play-signing-cert.yml). */
const ANDROID_CERT_SHA256 = [
  "BA:36:83:0F:E4:88:AE:52:88:E6:44:9E:28:7F:21:F2:06:B0:E4:7E:28:F6:86:91:04:B4:74:0C:76:A9:1E:30",
];
/** …and the website otherwise. The #CODE/KEY fragment never reaches this server. */
const WEB_JOIN = "https://jeopardizzy.github.io/Jeopardizzy-/#/join/";

const json = (body: unknown) =>
  new Response(JSON.stringify(body), { headers: { "content-type": "application/json" } });

const JOIN_PAGE = `<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width">
<title>Join Quizzical Club</title>
<script>location.replace(${JSON.stringify(WEB_JOIN)} + location.hash.slice(1))</script>
<p style="font-family:sans-serif">Opening Quizzical Club…</p>`;

export class PartyRelay {
  private hub = new RelayHub();

  constructor(private state: DurableObjectState) {}

  async fetch(request: Request): Promise<Response> {
    if (request.headers.get("Upgrade") !== "websocket") {
      return new Response("Expected a WebSocket", { status: 426 });
    }
    const pair = new WebSocketPair();
    const [client, server] = Object.values(pair) as [WebSocket, WebSocket];
    server.accept();
    const conn: Conn = {
      send: (text) => {
        try {
          server.send(text);
        } catch {
          // already closed
        }
      },
      close: () => {
        try {
          server.close(1000);
        } catch {
          // already closed
        }
      },
    };
    server.addEventListener("message", (e) => {
      // envelope JSON around at most MAX_DATA of ciphertext
      if (typeof e.data !== "string" || e.data.length > MAX_DATA + 512) return;
      try {
        this.hub.handle(conn, e.data);
      } catch {
        conn.close();
      }
    });
    server.addEventListener("close", () => this.hub.drop(conn));
    server.addEventListener("error", () => this.hub.drop(conn));
    if ((await this.state.storage.getAlarm()) === null) await this.state.storage.setAlarm(Date.now() + SWEEP_MS);
    return new Response(null, { status: 101, webSocket: client });
  }

  async alarm(): Promise<void> {
    this.hub.sweep();
    if (this.hub.roomCount > 0) await this.state.storage.setAlarm(Date.now() + SWEEP_MS);
  }
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    if (url.pathname === "/.well-known/apple-app-site-association") {
      return json({ applinks: { details: [{ appIDs: [APPLE_APP_ID], components: [{ "/": "/join*" }] }] } });
    }
    if (url.pathname === "/.well-known/assetlinks.json") {
      return json([
        {
          relation: ["delegate_permission/common.handle_all_urls"],
          target: { namespace: "android_app", package_name: ANDROID_PACKAGE, sha256_cert_fingerprints: ANDROID_CERT_SHA256 },
        },
      ]);
    }
    if (url.pathname === "/join") {
      return new Response(JOIN_PAGE, { headers: { "content-type": "text/html; charset=utf-8" } });
    }
    if (url.pathname !== "/ws") return new Response("Quizzical Club party relay\n", { status: 200 });
    return env.RELAY.get(env.RELAY.idFromName("party")).fetch(request);
  },
} satisfies ExportedHandler<Env>;
