import { create } from "zustand";
import {
  DEFAULT_RECORDS,
  DEFAULT_SETTINGS,
  loadRecords,
  loadSettings,
  saveRecords,
  saveSettings,
  type Records,
  type Settings,
} from "../lib/saves";

/**
 * The one in-memory copy of saved records and settings. Trivia Night and the
 * Workbook both read and write through here (their stores mirror it), so a
 * change made in one mode can never be overwritten by the other mode's stale
 * copy. Every write starts from the current value and saves at once.
 */
interface SavesState {
  records: Records;
  settings: Settings;
  /** change some settings, keep the rest; returns the saved settings */
  patchSettings: (patch: Partial<Settings>) => Settings;
  /** derive new records from the current ones; returns the saved records */
  updateRecords: (update: (current: Records) => Records) => Records;
}

const browser = typeof window !== "undefined";

export const useSaves = create<SavesState>((set, get) => ({
  records: browser ? loadRecords() : DEFAULT_RECORDS,
  settings: browser ? loadSettings() : DEFAULT_SETTINGS,

  patchSettings: (patch) => {
    const settings: Settings = { ...get().settings, ...patch };
    saveSettings(settings);
    set({ settings });
    return settings;
  },

  updateRecords: (update) => {
    const records = update(get().records);
    saveRecords(records);
    set({ records });
    return records;
  },
}));
