import { createDb } from "../db/client.js";
import { buildAdapter } from "../lib/adapter-bootstrap.js";
import { buildApp } from "../app.js";
import type { Config } from "../config.js";
import { migrate } from "drizzle-orm/better-sqlite3/migrator";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const migrationsFolder = resolve(
  dirname(fileURLToPath(import.meta.url)),
  "..",
  "db",
  "migrations",
);

export async function createTestApp() {
  const config: Config = {
    port: 0,
    host: "127.0.0.1",
    dbPath: ":memory:",
    adapter: "mock",
    hermesCliPath: "hermes",
    hermesTimeoutSeconds: 120,
    ollamaBaseUrl: "http://127.0.0.1:11434",
    ollamaModel: "nous-hermes2",
    cloudProvider: "openai",
    cloudModel: "gpt-4o",
    logLevel: "silent",
  };

  const db = createDb(config.dbPath);
  migrate(db, { migrationsFolder });

  const adapter = await buildAdapter(config);
  const { app } = await buildApp(db, adapter, config);
  await app.ready();
  return app;
}
