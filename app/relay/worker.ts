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
      if (typeof e.data === "string" && e.data.length <= MAX_DATA + 512) this.hub.handle(conn, e.data);
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
    if (url.pathname !== "/ws") return new Response("Quizzical Club party relay\n", { status: 200 });
    return env.RELAY.get(env.RELAY.idFromName("party")).fetch(request);
  },
} satisfies ExportedHandler<Env>;
