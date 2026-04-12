import { loadConfig } from "./config.js";
import { createDb } from "./db/client.js";
import { buildAdapter } from "./lib/adapter-bootstrap.js";
import { buildApp } from "./app.js";
import { migrate } from "drizzle-orm/better-sqlite3/migrator";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const config = loadConfig();
const db = createDb(config.dbPath);

// Auto-run migrations on startup
const migrationsFolder = resolve(
  dirname(fileURLToPath(import.meta.url)),
  "db",
  "migrations",
);
migrate(db, { migrationsFolder });

const adapter = await buildAdapter(config);
const { app } = await buildApp(db, adapter, config);

await app.listen({ port: config.port, host: config.host });
console.log(`Homeroom service listening on http://${config.host}:${config.port}`);
