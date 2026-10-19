import { describe, expect, it } from "vitest";
import { HOST_GRACE_MS, IDLE_MS, MAX_PEERS, RelayHub, type Conn } from "../../src/party/relayCore";
import { importRoomKey, newRoomKey, open, seal } from "../../src/party/crypto";
import {
  answer,
  buzz,
  buzzOrderText,
  newPartyGame,
  nextClue,
  openBuzzers,
  partyView,
  revealClue,
  startParty,
  type PartyGame,
} from "../../src/party/game";

class FakeConn implements Conn {
  got: Record<string, unknown>[] = [];
  closed = false;
  send(text: string) {
    this.got.push(JSON.parse(text));
  }
  close() {
    this.closed = true;
  }
  last() {
    return this.got[this.got.length - 1];
  }
}

function hubWithRoom(now = { t: 0 }) {
  const hub = new RelayHub(() => now.t);
  const host = new FakeConn();
  hub.handle(host, JSON.stringify({ op: "create" }));
  const { room, token } = host.last() as { room: string; token: string };
  return { hub, host, room, token, now };
}

describe("party relay", () => {
  it("opens a room with a 4-letter code and lets phones join", () => {
    const { hub, host, room } = hubWithRoom();
    expect(room).toMatch(/^[A-HJ-NP-Z]{4}$/);
    const phone = new FakeConn();
    hub.handle(phone, JSON.stringify({ op: "join", room: room.toLowerCase(), peer: "p1" }));
    expect(phone.last()).toEqual({ op: "joined", room });
    expect(host.last()).toEqual({ op: "peer", peer: "p1", up: true });
  });

  it("forwards phone messages only to the host, stamped with the relay clock", () => {
    const { hub, host, room, now } = hubWithRoom();
    const a = new FakeConn();
    const b = new FakeConn();
    hub.handle(a, JSON.stringify({ op: "join", room, peer: "a" }));
    hub.handle(b, JSON.stringify({ op: "join", room, peer: "b" }));
    now.t = 1234;
    hub.handle(a, JSON.stringify({ op: "send", to: "all", data: "secret" }));
    expect(host.last()).toEqual({ op: "msg", from: "a", at: 1234, data: "secret" });
    expect(b.got.some((m) => m.op === "msg")).toBe(false);
  });

  it("forwards host messages to everyone or to one phone", () => {
    const { hub, host, room } = hubWithRoom();
    const a = new FakeConn();
    const b = new FakeConn();
    hub.handle(a, JSON.stringify({ op: "join", room, peer: "a" }));
    hub.handle(b, JSON.stringify({ op: "join", room, peer: "b" }));
    hub.handle(host, JSON.stringify({ op: "send", to: "all", data: "x" }));
    expect(a.last()).toMatchObject({ op: "msg", from: "host", data: "x" });
    expect(b.last()).toMatchObject({ op: "msg", from: "host", data: "x" });
    hub.handle(host, JSON.stringify({ op: "send", to: "b", data: "y" }));
    expect(b.last()).toMatchObject({ data: "y" });
    expect(a.last()).toMatchObject({ data: "x" });
  });

  it("refuses unknown rooms, oversized data and full rooms", () => {
    const { hub, room } = hubWithRoom();
    const p = new FakeConn();
    hub.handle(p, JSON.stringify({ op: "join", room: "ZZZZ", peer: "p" }));
    expect(p.last()).toEqual({ op: "error", code: "no-room" });
    hub.handle(p, JSON.stringify({ op: "join", room, peer: "p" }));
    hub.handle(p, JSON.stringify({ op: "send", to: "host", data: "x".repeat(9000) }));
    expect(p.last()).toEqual({ op: "error", code: "bad-data" });
    for (let i = 0; i < MAX_PEERS; i++) hub.handle(new FakeConn(), JSON.stringify({ op: "join", room, peer: `q${i}` }));
    const late = new FakeConn();
    hub.handle(late, JSON.stringify({ op: "join", room, peer: "late" }));
    expect(late.last()).toEqual({ op: "error", code: "room-full" });
  });

  it("a phone that reconnects with the same id replaces its old connection", () => {
    const { hub, room } = hubWithRoom();
    const first = new FakeConn();
    const again = new FakeConn();
    hub.handle(first, JSON.stringify({ op: "join", room, peer: "p" }));
    hub.handle(again, JSON.stringify({ op: "join", room, peer: "p" }));
    expect(first.closed).toBe(true);
    expect(again.last()).toEqual({ op: "joined", room });
  });

  it("the host can come back with its token; the room closes if it doesn't", () => {
    const { hub, host, room, token, now } = hubWithRoom();
    const phone = new FakeConn();
    hub.handle(phone, JSON.stringify({ op: "join", room, peer: "p" }));
    hub.drop(host);
    const back = new FakeConn();
    hub.handle(back, JSON.stringify({ op: "rehost", room, token: "wrong" }));
    expect(back.last()).toEqual({ op: "error", code: "no-room" });
    hub.handle(back, JSON.stringify({ op: "rehost", room, token }));
    expect(back.got).toContainEqual({ op: "peer", peer: "p", up: true });

    hub.drop(back);
    now.t += HOST_GRACE_MS + 1;
    hub.sweep();
    expect(hub.roomCount).toBe(0);
    expect(phone.last()).toEqual({ op: "closed" });
  });

  it("idle rooms close", () => {
    const { hub, now } = hubWithRoom();
    now.t += IDLE_MS + 1;
    hub.sweep();
    expect(hub.roomCount).toBe(0);
  });
});

describe("party encryption", () => {
  it("round-trips with the shared key and rejects other keys or tampering", async () => {
    const host = await newRoomKey();
    const phoneKey = await importRoomKey(host.text);
    const data = await seal(host.key, { t: "answer", text: "Ice Mice" });
    expect(data).not.toContain("Ice");
    expect(await open(phoneKey, data)).toEqual({ t: "answer", text: "Ice Mice" });
    expect(await open((await newRoomKey()).key, data)).toBeNull();
    const flipped = data.slice(0, -2) + (data.endsWith("A") ? "B" : "A") + data.slice(-1);
    expect(await open(phoneKey, flipped)).toBeNull();
  });
});

describe("party game rules", () => {
  const teams = [0, 1, 2].map((id) => ({ id, name: ["Sage", "Butter", "Coral"][id], color: "#000", score: 0 }));
  const clues = [
    { categoryName: "C", clue: "Frozen water", answer: "Ice", value: 100 },
    { categoryName: "C", clue: "Six-sided flake", answer: "Snowflake", value: 200 },
  ];
  const ready = (): PartyGame => openBuzzers(startParty(newPartyGame(teams, clues)), 1000);

  it("the earliest buzz by relay time answers, whatever order the messages were handled in", () => {
    let g = ready();
    g = buzz(g, 1, 1500);
    g = buzz(g, 2, 1300); // arrived at the relay first, handled second
    expect(g.answering).toBe(1); // the turn was already given…
    expect(g.buzzes.map((b) => b.team)).toEqual([2, 1]); // …but the order shown is fair
    expect(buzzOrderText(partyView(g))).toBe("Coral first · Butter +0.20 s");
  });

  it("ignores buzzes before the buzzers open, repeats and teams that already missed", () => {
    let g = startParty(newPartyGame(teams, clues));
    expect(buzz(g, 0, 5)).toBe(g); // still reading
    g = openBuzzers(g, 1000);
    expect(buzz(g, 0, 999)).toBe(g); // early
    g = buzz(g, 0, 1001);
    expect(buzz(g, 0, 1002)).toBe(g);
    g = answer(g, 0, "nope");
    expect(buzz(g, 0, 1003)).toBe(g);
  });

  it("a miss passes to the next buzzer; a correct answer scores and reveals", () => {
    let g = ready();
    g = buzz(buzz(g, 0, 1100), 1, 1200);
    g = answer(g, 1, "Ice"); // not their turn
    expect(g.lastAnswer).toBeNull();
    g = answer(g, 0, "Water");
    expect(g.answering).toBe(1);
    expect(g.lastAnswer).toMatchObject({ team: 0, correct: false });
    g = answer(g, 1, "ice");
    expect(g.phase).toBe("revealed");
    expect(g.winner).toBe(1);
    expect(g.teams[1].score).toBe(100);
  });

  it("with no buzzer left, buzzing reopens for the teams that haven't tried; all missing reveals", () => {
    let g = buzz(ready(), 0, 1100);
    g = answer(g, 0, "no");
    expect(g.phase).toBe("buzzing");
    g = answer(buzz(g, 1, 1200), 1, "no");
    g = answer(buzz(g, 2, 1300), 2, "no");
    expect(g.phase).toBe("revealed");
    expect(g.winner).toBeNull();
  });

  it("phones never see the answer before the reveal", () => {
    let g = buzz(ready(), 0, 1100);
    expect(JSON.stringify(partyView(g))).not.toContain('"Ice"');
    g = revealClue(g);
    expect(partyView(g).answer).toBe("Ice");
  });

  it("moves through the clues to the end", () => {
    let g = revealClue(ready());
    g = nextClue(g);
    expect(g.phase).toBe("reading");
    expect(partyView(g).clue?.clue).toBe("Six-sided flake");
    g = nextClue(revealClue(g));
    expect(g.phase).toBe("done");
    expect(partyView(g).clue).toBeNull();
  });
});

describe("join links", async () => {
  const { DEPLOYED_RELAY, joinLink, joinRouteFor } = await import("../../src/party/connection");

  it("with the deployed relay, the QR code points at the relay's /join page (opens the app if installed)", () => {
    const link = joinLink(DEPLOYED_RELAY, "ABCD", "Cg74X3C6c9L7T_E9iFlFVg");
    expect(link).toBe("https://quizzical-club-party-relay.apsftllc.workers.dev/join#ABCD/Cg74X3C6c9L7T_E9iFlFVg");
    expect(joinRouteFor(link)).toBe("/join/ABCD/Cg74X3C6c9L7T_E9iFlFVg");
  });

  it("ignores links that aren't join links", () => {
    expect(joinRouteFor("https://quizzical-club-party-relay.apsftllc.workers.dev/")).toBeNull();
    expect(joinRouteFor("https://example.com/join#AB/short")).toBeNull();
  });
});

describe("party relay hardening (review findings)", () => {
  it("ignores valid-JSON non-objects instead of throwing", () => {
    const { hub } = hubWithRoom();
    const c = new FakeConn();
    for (const text of ["null", "42", "[]", '"x"', "true"]) {
      expect(() => hub.handle(c, text)).not.toThrow();
      expect(c.last()).toEqual({ op: "error", code: "bad-json" });
    }
  });

  it("one connection can't occupy a room under many ids", () => {
    const { hub, room } = hubWithRoom();
    const c = new FakeConn();
    hub.handle(c, JSON.stringify({ op: "join", room, peer: "p0" }));
    for (let i = 1; i < MAX_PEERS; i++) hub.handle(c, JSON.stringify({ op: "join", room, peer: `p${i}` }));
    expect(c.last()).toEqual({ op: "error", code: "already-in-room" });
    hub.drop(c);
    // every real phone still fits
    for (let i = 0; i < MAX_PEERS; i++) {
      const phone = new FakeConn();
      hub.handle(phone, JSON.stringify({ op: "join", room, peer: `real${i}` }));
      expect(phone.last()).toEqual({ op: "joined", room });
    }
  });

  it("a host connection can't also join as a phone, and a phone can't take over as host", () => {
    const { hub, host, room, token } = hubWithRoom();
    hub.handle(host, JSON.stringify({ op: "join", room, peer: "x" }));
    expect(host.last()).toEqual({ op: "error", code: "already-in-room" });
    const phone = new FakeConn();
    hub.handle(phone, JSON.stringify({ op: "join", room, peer: "p" }));
    hub.handle(phone, JSON.stringify({ op: "rehost", room, token }));
    expect(phone.last()).toEqual({ op: "error", code: "already-in-room" });
  });
});
