import { z } from "zod";

/**
 * Versioned localStorage saves with corrupt-save recovery:
 * anything that fails schema validation is discarded and rebuilt as defaults.
 */

const RecordsSchema = z.object({
  version: z.literal(1),
  bestScore: z.number(),
  bestStreak: z.number(),
  gamesPlayed: z.number(),
  totalCorrect: z.number(),
  totalAnswered: z.number(),
  dailyScores: z.record(z.string(), z.number()),
});
export type Records = z.infer<typeof RecordsSchema>;

const SettingsSchema = z.object({
  version: z.literal(1),
  sound: z.boolean(),
  reduceMotion: z.boolean(),
});
export type Settings = z.infer<typeof SettingsSchema>;

export const DEFAULT_RECORDS: Records = {
  version: 1,
  bestScore: 0,
  bestStreak: 0,
  gamesPlayed: 0,
  totalCorrect: 0,
  totalAnswered: 0,
  dailyScores: {},
};

export const DEFAULT_SETTINGS: Settings = {
  version: 1,
  sound: true,
  reduceMotion: false,
};

const RECORDS_KEY = "quizzical:records:v1";
const SETTINGS_KEY = "quizzical:settings:v1";

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
