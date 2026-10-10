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
    const r = { ...DEFAULT_RECORDS, gamesPlayed: 4, workbookBests: { "homonyms|easy": 9 } };
    saveRecords(r);
    expect(loadRecords()).toEqual(r);
  });

  it("recovers from corrupt JSON", () => {
    store.set("quizzical-club:records:v1", "{not json!!");
    expect(loadRecords()).toEqual(DEFAULT_RECORDS);
  });

  it("recovers from schema-invalid data", () => {
    store.set("quizzical-club:records:v1", JSON.stringify({ version: 99 }));
    expect(loadRecords()).toEqual(DEFAULT_RECORDS);
    store.set("quizzical-club:settings:v1", JSON.stringify({ sound: "yes" }));
    expect(loadSettings()).toEqual(DEFAULT_SETTINGS);
  });
});
