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
const { app, schedulerService } = await buildApp(db, adapter, config, config.mirrorPath);

await app.listen({ port: config.port, host: config.host });

// Boot the cron scheduler after the service is listening
schedulerService.boot();

console.log(`Homeroom service listening on http://${config.host}:${config.port}`);
console.log(
  "Security: No authentication. Anyone who can reach this address can manage agents, " +
  "trigger runs, and read/write credentials. Intended for single-user localhost use only.",
);
if (config.host !== "127.0.0.1" && config.host !== "localhost") {
  console.warn(
    `⚠️  HOST is set to "${config.host}". The service is accessible beyond localhost. ` +
    "This exposes all endpoints without authentication. Only do this on trusted private networks.",
  );
}

// Graceful shutdown
function shutdown() {
  schedulerService.shutdown();
  app.close().then(() => process.exit(0));
}
process.on("SIGTERM", shutdown);
process.on("SIGINT", shutdown);
