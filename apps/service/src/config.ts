import { resolve } from "path";

export interface Config {
  port: number;
  host: string;
  dbPath: string;
  adapter: "mock"; // Phase 3+ will add "openclaw-cli" | "openclaw-bridge"
  logLevel: string;
}

export function loadConfig(): Config {
  return {
    port: parseInt(process.env["PORT"] ?? "5174", 10),
    host: process.env["HOST"] ?? "127.0.0.1",
    dbPath: process.env["DB_PATH"] ?? resolve(process.cwd(), "homeroom.db"),
    adapter: (process.env["ADAPTER"] as Config["adapter"]) ?? "mock",
    logLevel: process.env["LOG_LEVEL"] ?? "info",
  };
}
