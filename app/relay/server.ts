// Local party relay for development and LAN testing (prototype).
// usage (from app/): npm run relay            → ws://localhost:8787
//        PORT=9000 npm run relay
//
// Forwards encrypted messages between a host and team phones; keeps nothing
// and logs no message contents (see src/party/relayCore.ts).
import { WebSocketServer } from "ws";
import { RelayHub, type Conn } from "../src/party/relayCore";

const port = Number(process.env.PORT ?? 8787);
const hub = new RelayHub();
const wss = new WebSocketServer({ port, maxPayload: 16 * 1024 });

wss.on("connection", (ws) => {
  const conn: Conn = {
    send: (text) => ws.readyState === ws.OPEN && ws.send(text),
    close: () => ws.close(),
  };
  ws.on("message", (data) => hub.handle(conn, data.toString()));
  ws.on("close", () => hub.drop(conn));
  ws.on("error", () => hub.drop(conn));
});

setInterval(() => hub.sweep(), 60_000).unref();
console.log(`party relay listening on ws://localhost:${port}`);
