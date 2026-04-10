import { migrate } from "drizzle-orm/better-sqlite3/migrator";
import { createDb } from "./client.js";
import { loadConfig } from "../config.js";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const config = loadConfig();
const db = createDb(config.dbPath);
const migrationsFolder = resolve(dirname(fileURLToPath(import.meta.url)), "migrations");

migrate(db, { migrationsFolder });
console.log("Migrations applied.");
