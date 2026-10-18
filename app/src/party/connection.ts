import { importRoomKey, newRoomKey, open, seal } from "./crypto";
import type { PartyView } from "./game";

/** Team phone → host. */
export type PlayerMsg =
  | { t: "team"; team: number }
  | { t: "buzz"; clue: number }
  | { t: "answer"; clue: number; text: string };
/** Host → phones. */
export type HostMsg = { t: "view"; view: PartyView } | { t: "you"; team: number | null };

export type RoomStatus = "connecting" | "open" | "offline" | "no-room" | "closed";

/**
 * Where the relay lives. Prototype: only on a local dev or preview server
 * (localhost with a port), or wherever VITE_PARTY_RELAY points; never inside
 * the store apps until the relay is deployed.
 */
export const RELAY_URL: string | null =
  (import.meta.env.VITE_PARTY_RELAY as string | undefined) ??
  (typeof location !== "undefined" && location.hostname === "localhost" && location.port
    ? "ws://localhost:8787/ws"
    : null);

/** One WebSocket to the relay that reconnects on its own, calling `hello` after every (re)connect. */
class RelaySocket {
  private ws: WebSocket | null = null;
  private stopped = false;
  private retry = 0;

  constructor(
    private url: string,
    private hello: (send: (m: object) => void) => void,
    private onRelay: (m: Record<string, unknown>) => void,
    private onStatus: (s: RoomStatus) => void,
  ) {
    this.connect();
  }

  send(m: object): void {
    if (this.ws?.readyState === WebSocket.OPEN) this.ws.send(JSON.stringify(m));
  }

  stop(): void {
    this.stopped = true;
    this.ws?.close();
  }

  private connect(): void {
    if (this.stopped) return;
    this.onStatus("connecting");
    const ws = new WebSocket(this.url);
    this.ws = ws;
    ws.onopen = () => {
      this.retry = 0;
      this.hello((m) => ws.send(JSON.stringify(m)));
    };
    ws.onmessage = (e) => {
      try {
        this.onRelay(JSON.parse(String(e.data)));
      } catch {
        // ignore anything that isn't relay JSON
      }
    };
    ws.onclose = () => {
      if (this.stopped) return;
      this.onStatus("offline");
      const wait = Math.min(8000, 500 * 2 ** this.retry++);
      window.setTimeout(() => this.connect(), wait);
    };
  }
}

/** Keeps async encrypt/decrypt in message order. */
function serial() {
  let chain: Promise<unknown> = Promise.resolve();
  return (task: () => Promise<unknown>) => {
    chain = chain.then(task, task);
  };
}

export interface HostRoom {
  code: Promise<string>;
  /** the join link, with the room key in the #fragment */
  link: Promise<string>;
  sendAll(msg: HostMsg): void;
  sendTo(peer: string, msg: HostMsg): void;
  close(): void;
}

export function hostRoom(
  relay: string,
  on: {
    peer: (peer: string, up: boolean) => void;
    message: (peer: string, msg: PlayerMsg, at: number) => void;
    status: (s: RoomStatus) => void;
  },
): HostRoom {
  const keyP = newRoomKey();
  let room: { code: string; token: string } | null = null;
  let resolveCode: (c: string) => void = () => {};
  const code = new Promise<string>((r) => (resolveCode = r));
  const out = serial();
  const inbox = serial();

  const sock = new RelaySocket(
    relay,
    (send) => send(room ? { op: "rehost", room: room.code, token: room.token } : { op: "create" }),
    (m) => {
      if (m.op === "created") {
        room = { code: String(m.room), token: String(m.token) };
        resolveCode(room.code);
        on.status("open");
      } else if (m.op === "peer") on.peer(String(m.peer), m.up === true);
      else if (m.op === "msg") {
        inbox(async () => {
          const msg = (await open((await keyP).key, String(m.data))) as PlayerMsg | null;
          if (msg && typeof msg === "object" && "t" in msg) on.message(String(m.from), msg, Number(m.at));
        });
      } else if (m.op === "closed") on.status("closed");
      else if (m.op === "error" && m.code === "no-room") on.status("no-room");
    },
    on.status,
  );

  const send = (to: string, msg: HostMsg) =>
    out(async () => sock.send({ op: "send", to, data: await seal((await keyP).key, msg) }));

  return {
    code,
    link: Promise.all([code, keyP]).then(
      ([c, k]) => `${location.origin}${location.pathname}#/join/${c}/${k.text}`,
    ),
    sendAll: (msg) => send("all", msg),
    sendTo: (peer, msg) => send(peer, msg),
    close: () => sock.stop(),
  };
}

export interface PlayerRoom {
  send(msg: PlayerMsg): void;
  close(): void;
}

/** A stable id for this phone in this room, so a reconnect keeps its team. */
function peerId(code: string): string {
  const k = `quizzical-club:party-peer:${code}`;
  try {
    const old = sessionStorage.getItem(k);
    if (old) return old;
    const id = Math.random().toString(36).slice(2, 12);
    sessionStorage.setItem(k, id);
    return id;
  } catch {
    return Math.random().toString(36).slice(2, 12);
  }
}

export function joinRoom(
  relay: string,
  code: string,
  keyText: string,
  on: { message: (msg: HostMsg) => void; status: (s: RoomStatus) => void },
): PlayerRoom {
  const keyP = importRoomKey(keyText);
  const peer = peerId(code);
  const out = serial();
  const inbox = serial();
  const sock = new RelaySocket(
    relay,
    (send) => send({ op: "join", room: code, peer }),
    (m) => {
      if (m.op === "joined") on.status("open");
      else if (m.op === "msg") {
        inbox(async () => {
          const msg = (await open(await keyP, String(m.data))) as HostMsg | null;
          if (msg && typeof msg === "object" && "t" in msg) on.message(msg);
        });
      } else if (m.op === "closed") on.status("closed");
      else if (m.op === "error" && m.code === "no-room") on.status("no-room");
    },
    on.status,
  );
  return {
    send: (msg) => out(async () => sock.send({ op: "send", to: "host", data: await seal(await keyP, msg) })),
    close: () => sock.stop(),
  };
}
