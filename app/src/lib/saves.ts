import { z } from "zod";

/**
 * Versioned localStorage saves with corrupt-save recovery:
 * anything that fails schema validation is discarded and rebuilt as defaults.
 */

const RecordsSchema = z.object({
  version: z.literal(1),
  gamesPlayed: z.number(),
  /** best workbook score per "type|level" key, e.g. "homonyms|easy" */
  workbookBests: z.record(z.string(), z.number()),
});
export type Records = z.infer<typeof RecordsSchema>;

const SettingsSchema = z.object({
  version: z.literal(1),
  sound: z.boolean(),
  reduceMotion: z.boolean(),
  /** last used team names, for convenience */
  teamNames: z.array(z.string()),
});
export type Settings = z.infer<typeof SettingsSchema>;

export const DEFAULT_RECORDS: Records = {
  version: 1,
  gamesPlayed: 0,
  workbookBests: {},
};

export const DEFAULT_SETTINGS: Settings = {
  version: 1,
  sound: true,
  reduceMotion: false,
  teamNames: ["Team Sage", "Team Butter"],
};

const RECORDS_KEY = "quizzical-club:records:v1";
const SETTINGS_KEY = "quizzical-club:settings:v1";

function safeLoad<T>(key: string, schema: z.ZodType<T>, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    const parsed = schema.safeParse(JSON.parse(raw));
    return parsed.success ? parsed.data : fallback;
  } catch {
    return fallback;
  }
}

function safeSave(key: string, value: unknown): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // storage full or unavailable — play on without persistence
  }
}

export const loadRecords = (): Records => safeLoad(RECORDS_KEY, RecordsSchema, DEFAULT_RECORDS);
export const saveRecords = (r: Records): void => safeSave(RECORDS_KEY, r);
export const loadSettings = (): Settings => safeLoad(SETTINGS_KEY, SettingsSchema, DEFAULT_SETTINGS);
export const saveSettings = (s: Settings): void => safeSave(SETTINGS_KEY, s);
