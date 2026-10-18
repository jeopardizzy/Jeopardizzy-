/**
 * Party relay: rooms that forward messages between one host and the team
 * phones. It keeps nothing: rooms live in memory, messages are passed on and
 * forgotten, and their contents are end-to-end encrypted (see crypto.ts), so
 * the relay only ever sees opaque strings. Pure logic; the transport
 * (relay/server.ts locally, a serverless host later) plugs in through Conn.
 *
 * Client → relay (JSON):
 *   { op: "create" }                              host opens a room
 *   { op: "rehost", room, token }                 host reconnects
 *   { op: "join", room, peer }                    a phone joins (peer = its own random id)
 *   { op: "send", to: "host" | "all" | peer, data }
 * Relay → client:
 *   { op: "created", room, token } | { op: "joined", room }
 *   { op: "peer", peer, up }                      to the host: a phone came or went
 *   { op: "msg", from: "host" | peer, at, data }  at = relay clock (ms), used for buzz order
 *   { op: "closed" } | { op: "error", code }
 */

export interface Conn {
  send(text: string): void;
  close(): void;
}

interface Room {
  code: string;
  token: string;
  host: Conn | null;
  hostGoneAt: number | null;
  peers: Map<string, Conn>;
  lastActive: number;
}

export const MAX_PEERS = 16;
export const MAX_DATA = 8_000;
/** a room closes this long after its host disconnected */
export const HOST_GRACE_MS = 2 * 60_000;
/** and this long after the last message */
export const IDLE_MS = 2 * 60 * 60_000;
/** no I/O/0/1-lookalikes: easy to read aloud and type */
const CODE_LETTERS = "ABCDEFGHJKLMNPQRSTUVWXYZ";

type Role = { kind: "host"; room: Room } | { kind: "peer"; room: Room; peer: string };

export class RelayHub {
  private rooms = new Map<string, Room>();
  private roles = new Map<Conn, Role>();

  constructor(
    private now: () => number = Date.now,
    private random: () => number = Math.random,
  ) {}

  get roomCount(): number {
    return this.rooms.size;
  }

  handle(conn: Conn, text: string): void {
    let m: Record<string, unknown>;
    try {
      m = JSON.parse(text);
    } catch {
      return reply(conn, { op: "error", code: "bad-json" });
    }
    const role = this.roles.get(conn);
    switch (m.op) {
      case "create": {
        if (role) return reply(conn, { op: "error", code: "already-in-room" });
        const room: Room = {
          code: this.newCode(),
          token: this.newToken(),
          host: conn,
          hostGoneAt: null,
          peers: new Map(),
          lastActive: this.now(),
        };
        this.rooms.set(room.code, room);
        this.roles.set(conn, { kind: "host", room });
        return reply(conn, { op: "created", room: room.code, token: room.token });
      }
      case "rehost": {
        const room = this.rooms.get(String(m.room ?? "").toUpperCase());
        if (!room || m.token !== room.token) return reply(conn, { op: "error", code: "no-room" });
        if (room.host && room.host !== conn) room.host.close();
        room.host = conn;
        room.hostGoneAt = null;
        room.lastActive = this.now();
        this.roles.set(conn, { kind: "host", room });
        reply(conn, { op: "created", room: room.code, token: room.token });
        for (const peer of room.peers.keys()) reply(conn, { op: "peer", peer, up: true });
        return;
      }
      case "join": {
        const room = this.rooms.get(String(m.room ?? "").toUpperCase());
        const peer = typeof m.peer === "string" ? m.peer.slice(0, 40) : "";
        if (!room) return reply(conn, { op: "error", code: "no-room" });
        if (!peer) return reply(conn, { op: "error", code: "bad-peer" });
        const old = room.peers.get(peer);
        if (!old && room.peers.size >= MAX_PEERS) return reply(conn, { op: "error", code: "room-full" });
        if (old && old !== conn) {
          this.roles.delete(old);
          old.close();
        }
        room.peers.set(peer, conn);
        room.lastActive = this.now();
        this.roles.set(conn, { kind: "peer", room, peer });
        reply(conn, { op: "joined", room: room.code });
        if (room.host) reply(room.host, { op: "peer", peer, up: true });
        return;
      }
      case "send": {
        if (!role) return reply(conn, { op: "error", code: "not-in-room" });
        const data = m.data;
        if (typeof data !== "string" || data.length > MAX_DATA) return reply(conn, { op: "error", code: "bad-data" });
        const room = role.room;
        room.lastActive = this.now();
        const out = JSON.stringify({
          op: "msg",
          from: role.kind === "host" ? "host" : role.peer,
          at: this.now(),
          data,
        });
        if (role.kind === "peer") {
          // phones only ever talk to the host
          room.host?.send(out);
          return;
        }
        if (m.to === "all") room.peers.forEach((c) => c.send(out));
        else if (typeof m.to === "string") room.peers.get(m.to)?.send(out);
        return;
      }
      default:
        return reply(conn, { op: "error", code: "bad-op" });
    }
  }

  /** The connection went away. */
  drop(conn: Conn): void {
    const role = this.roles.get(conn);
    this.roles.delete(conn);
    if (!role) return;
    const room = role.room;
    if (role.kind === "host") {
      if (room.host === conn) {
        room.host = null;
        room.hostGoneAt = this.now();
      }
      return;
    }
    if (room.peers.get(role.peer) === conn) {
      room.peers.delete(role.peer);
      if (room.host) reply(room.host, { op: "peer", peer: role.peer, up: false });
    }
  }

  /** Close rooms whose host left too long ago or that went quiet. Call every minute or so. */
  sweep(): void {
    const t = this.now();
    for (const room of this.rooms.values()) {
      const hostGone = room.hostGoneAt !== null && t - room.hostGoneAt > HOST_GRACE_MS;
      if (hostGone || t - room.lastActive > IDLE_MS) this.close(room);
    }
  }

  private close(room: Room): void {
    this.rooms.delete(room.code);
    const conns = [...room.peers.values(), ...(room.host ? [room.host] : [])];
    for (const c of conns) {
      this.roles.delete(c);
      reply(c, { op: "closed" });
      c.close();
    }
  }

  private newCode(): string {
    for (;;) {
      let code = "";
      for (let i = 0; i < 4; i++) code += CODE_LETTERS[Math.floor(this.random() * CODE_LETTERS.length)];
      if (!this.rooms.has(code)) return code;
    }
  }

  private newToken(): string {
    let t = "";
    for (let i = 0; i < 24; i++) t += Math.floor(this.random() * 36).toString(36);
    return t;
  }
}

function reply(conn: Conn, msg: object): void {
  conn.send(JSON.stringify(msg));
}
