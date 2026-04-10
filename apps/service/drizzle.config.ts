import { defineConfig } from "drizzle-kit";
import { resolve } from "path";

const dbPath = process.env["DB_PATH"] ?? resolve(process.cwd(), "homeroom.db");

export default defineConfig({
  schema: "./src/db/schema.ts",
  out: "./src/db/migrations",
  dialect: "sqlite",
  dbCredentials: {
    url: dbPath,
  },
});
