import { beforeEach, describe, expect, it } from "vitest";
import { buildBackup, parseBackup } from "../../src/lib/backup";
import {
  DEFAULT_RECORDS,
  DEFAULT_SETTINGS,
  loadRecords,
  loadSettings,
  saveRecords,
  saveSettings,
} from "../../src/lib/saves";

const store = new Map<string, string>();
const localStorageStub = {
  getItem: (k: string) => store.get(k) ?? null,
  setItem: (k: string, v: string) => void store.set(k, v),
  removeItem: (k: string) => void store.delete(k),
  clear: () => store.clear(),
};
(globalThis as { localStorage?: unknown }).localStorage = localStorageStub;

describe("backup", () => {
  beforeEach(() => store.clear());

  it("round-trips records and settings", () => {
    const records = {
      ...DEFAULT_RECORDS,
      gamesPlayed: 7,
      workbookBests: { "homonyms|easy|10": 8 },
      categoryStats: { Homonyms: { played: 5, missed: 2 } },
    };
    const settings = { ...DEFAULT_SETTINGS, sound: false, workbookCount: 20 };
    const parsed = parseBackup(buildBackup(records, settings));
    expect(parsed).not.toBeNull();
    expect(parsed!.records).toEqual(records);
    expect(parsed!.settings).toEqual(settings);
  });

  it("rejects garbage and foreign payloads without touching storage", () => {
    expect(parseBackup("not json")).toBeNull();
    expect(parseBackup('{"kind":"other-app"}')).toBeNull();
    expect(parseBackup(JSON.stringify({
      kind: "quizzical-club-backup",
      version: 99,
      exportedAt: "x",
      records: { version: 99 },
      settings: {},
    }))).toBeNull();
  });

  it("rejects backups with schema-invalid records", () => {
    const bad = buildBackup(DEFAULT_RECORDS, DEFAULT_SETTINGS);
    const tampered = JSON.parse(bad);
    tampered.records = { version: 1, gamesPlayed: "lots" };
    expect(parseBackup(JSON.stringify(tampered))).toBeNull();
  });

  it("restores into storage via loadRecords after save", () => {
    const records = { ...DEFAULT_RECORDS, gamesPlayed: 12 };
    const parsed = parseBackup(buildBackup(records, DEFAULT_SETTINGS))!;
    saveRecords(parsed.records);
    saveSettings(parsed.settings);
    expect(loadRecords()).toEqual(records);
    expect(loadSettings()).toEqual(DEFAULT_SETTINGS);
  });
});
