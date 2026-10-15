import { z } from "zod";
import { RecordsSchema, SettingsSchema, type Records, type Settings } from "./saves";

/**
 * Progress backup: a single JSON file (or clipboard text) carrying records
 * and settings between devices. Validated with Zod on import; anything
 * malformed or from another app is rejected before touching storage.
 */

const BackupSchema = z.object({
  kind: z.literal("quizzical-club-backup"),
  version: z.literal(1),
  exportedAt: z.string(),
  records: RecordsSchema,
  settings: SettingsSchema,
});

export interface Backup {
  records: Records;
  settings: Settings;
}

export function buildBackup(records: Records, settings: Settings): string {
  return JSON.stringify(
    {
      kind: "quizzical-club-backup",
      version: 1,
      exportedAt: new Date().toISOString(),
      records,
      settings,
    },
    null,
    2,
  );
}

/** Parse backup text; returns null when the payload is invalid. */
export function parseBackup(text: string): Backup | null {
  try {
    const parsed = BackupSchema.safeParse(JSON.parse(text));
    if (!parsed.success) return null;
    return { records: parsed.data.records, settings: parsed.data.settings };
  } catch {
    return null;
  }
}

/** Trigger a file download in the browser (works in Capacitor too). */
export function downloadBackup(filename: string, text: string): void {
  const blob = new Blob([text], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
