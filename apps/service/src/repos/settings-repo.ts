import type { Db } from "../db/client.js";
import { settings } from "../db/schema.js";
import { now } from "../lib/time.js";

type Row = typeof settings.$inferSelect;

export interface SettingsRow {
  defaultRuntimeMode: string;
  defaultSmartLevel: string;
  defaultSafetyLevel: string;
  openclawWorkspacePath: string;
  providerMeta: Record<string, { maskedKey: string | null; lastVerifiedAt: string | null }>;
  updatedAt: string;
}

function rowToSettings(row: Row): SettingsRow {
  return {
    defaultRuntimeMode: row.defaultRuntimeMode,
    defaultSmartLevel: row.defaultSmartLevel,
    defaultSafetyLevel: row.defaultSafetyLevel,
    openclawWorkspacePath: row.openclawWorkspacePath,
    providerMeta: JSON.parse(row.providerMeta),
    updatedAt: row.updatedAt,
  };
}

export function createSettingsRepo(db: Db) {
  return {
    get(): SettingsRow {
      let row = db.select().from(settings).get();
      if (!row) {
        db.insert(settings).values({ id: "singleton", updatedAt: now() }).run();
        row = db.select().from(settings).get()!;
      }
      return rowToSettings(row);
    },

    update(patch: Partial<Omit<SettingsRow, "updatedAt">>): SettingsRow {
      const existing = this.get();
      const providerMeta = patch.providerMeta ?? existing.providerMeta;
      db.update(settings)
        .set({
          defaultRuntimeMode: patch.defaultRuntimeMode ?? existing.defaultRuntimeMode,
          defaultSmartLevel: patch.defaultSmartLevel ?? existing.defaultSmartLevel,
          defaultSafetyLevel: patch.defaultSafetyLevel ?? existing.defaultSafetyLevel,
          openclawWorkspacePath: patch.openclawWorkspacePath ?? existing.openclawWorkspacePath,
          providerMeta: JSON.stringify(providerMeta),
          updatedAt: now(),
        })
        .run();
      return this.get();
    },
  };
}

export type SettingsRepo = ReturnType<typeof createSettingsRepo>;
