import { createDb } from "../db/client.js";
import { buildApp } from "../app.js";
import type { Config } from "../config.js";
import { migrate } from "drizzle-orm/better-sqlite3/migrator";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";
// Mock adapter is intentionally NOT part of the public package export.
// It's available via a separate subpath for test use only.
import { MockOpenClawAdapter } from "@homeroom/adapter-hermes/mock-adapter";

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
    adapter: "hermes",
    hermesCliPath: "hermes",
    hermesTimeoutSeconds: 120,
    ollamaBaseUrl: "http://127.0.0.1:11434",
    ollamaModel: "nous-hermes2",
    cloudProvider: "openai",
    cloudModel: "gpt-4o",
    logLevel: "silent",
    vaultPath: "/tmp/homeroom-test-vault",
    staticRoot: "/tmp/homeroom-nonexistent-static",
  };

  const db = createDb(config.dbPath);
  migrate(db, { migrationsFolder });

  // Use the mock adapter directly for tests — it's not exposed publicly
  // but is available for testing purposes.
  const adapter = new MockOpenClawAdapter();
  const { app } = await buildApp(db, adapter, config);
  await app.ready();
  return app;
}
