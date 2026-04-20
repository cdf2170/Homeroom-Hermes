/**
 * settings-repo.ts
 *
 * App-wide settings. Single row, keyed by id="singleton".
 *
 * Historical columns:
 *   - provider_meta: previously stored masked API key metadata. No longer
 *     read or written; the settings service now derives provider connection
 *     state from the encrypted credential store. The column stays in the DB
 *     for backward compatibility; a later migration can drop it.
 *   - openclaw_workspace_path: legacy column name; exposed in TypeScript as
 *     `defaultWorkspacePath`. The physical column name is kept so existing
 *     DB rows keep working without a migration.
 */

import type { Db } from "../db/client.js";
import { settings } from "../db/schema.js";
import { now } from "../lib/time.js";

type Row = typeof settings.$inferSelect;

export interface SettingsRow {
  defaultRuntimeMode: string;
  defaultSmartLevel: string;
  defaultSafetyLevel: string;
  /** Exposed name; stored in column `openclaw_workspace_path` for back-compat. */
  defaultWorkspacePath: string;
  updatedAt: string;
}

function rowToSettings(row: Row): SettingsRow {
  return {
    defaultRuntimeMode: row.defaultRuntimeMode,
    defaultSmartLevel: row.defaultSmartLevel,
    defaultSafetyLevel: row.defaultSafetyLevel,
    defaultWorkspacePath: row.openclawWorkspacePath,
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
      db.update(settings)
        .set({
          defaultRuntimeMode: patch.defaultRuntimeMode ?? existing.defaultRuntimeMode,
          defaultSmartLevel: patch.defaultSmartLevel ?? existing.defaultSmartLevel,
          defaultSafetyLevel: patch.defaultSafetyLevel ?? existing.defaultSafetyLevel,
          openclawWorkspacePath: patch.defaultWorkspacePath ?? existing.defaultWorkspacePath,
          updatedAt: now(),
        })
        .run();
      return this.get();
    },
  };
}

export type SettingsRepo = ReturnType<typeof createSettingsRepo>;
