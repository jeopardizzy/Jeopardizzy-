import { beforeEach, describe, expect, it } from "vitest";
import {
  DEFAULT_RECORDS,
  DEFAULT_SETTINGS,
  loadRecords,
  loadSettings,
  saveRecords,
  saveSettings,
} from "../../src/lib/saves";

// minimal localStorage stub for the node test environment
const store = new Map<string, string>();
const localStorageStub = {
  getItem: (k: string) => store.get(k) ?? null,
  setItem: (k: string, v: string) => void store.set(k, v),
  removeItem: (k: string) => void store.delete(k),
  clear: () => store.clear(),
};
(globalThis as { localStorage?: unknown }).localStorage = localStorageStub;

describe("saves", () => {
  beforeEach(() => store.clear());

  it("returns defaults when nothing is stored", () => {
    expect(loadRecords()).toEqual(DEFAULT_RECORDS);
    expect(loadSettings()).toEqual(DEFAULT_SETTINGS);
  });

  it("round-trips records", () => {
    const r = { ...DEFAULT_RECORDS, bestScore: 4200, gamesPlayed: 3 };
    saveRecords(r);
    expect(loadRecords()).toEqual(r);
  });

  it("recovers from corrupt JSON", () => {
    store.set("quizzical:records:v1", "{not json!!");
    expect(loadRecords()).toEqual(DEFAULT_RECORDS);
  });

  it("recovers from schema-invalid data (wrong version / wrong types)", () => {
    store.set("quizzical:records:v1", JSON.stringify({ version: 99, bestScore: "lots" }));
    expect(loadRecords()).toEqual(DEFAULT_RECORDS);
    store.set("quizzical:settings:v1", JSON.stringify({ sound: "yes" }));
    expect(loadSettings()).toEqual(DEFAULT_SETTINGS);
  });

  it("persists settings", () => {
    const s = { version: 1 as const, sound: false, reduceMotion: true };
    saveSettings(s);
    expect(loadSettings()).toEqual(s);
  });
});
