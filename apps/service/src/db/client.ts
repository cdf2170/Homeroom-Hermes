import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import * as schema from "./schema.js";

export type Db = ReturnType<typeof createDb>;

export function createDb(dbPath: string) {
  const sqlite = new Database(dbPath);
  // Enable WAL mode for better concurrent read perf
  sqlite.pragma("journal_mode = WAL");
  // Enforce foreign keys
  sqlite.pragma("foreign_keys = ON");

  return drizzle(sqlite, { schema });
}
