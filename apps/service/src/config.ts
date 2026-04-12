import { resolve } from "path";

export interface Config {
  port: number;
  host: string;
  dbPath: string;
  adapter: "mock" | "hermes" | "ollama" | "cloud";
  /** Path to the hermes binary. Defaults to "hermes" (on PATH). */
  hermesCliPath: string;
  /** Timeout (seconds) for a single agent turn. Defaults to 120. */
  hermesTimeoutSeconds: number;
  /** Base URL for the Ollama API. Defaults to http://127.0.0.1:11434 */
  ollamaBaseUrl: string;
  /** Ollama model name. Defaults to nous-hermes2 */
  ollamaModel: string;
  /** Cloud provider. Defaults to openai */
  cloudProvider: string;
  /** Cloud model. Defaults to gpt-4o */
  cloudModel: string;
  logLevel: string;
}

export function loadConfig(): Config {
  return {
    port:                 parseInt(process.env["PORT"] ?? "5174", 10),
    host:                 process.env["HOST"] ?? "127.0.0.1",
    dbPath:               process.env["DB_PATH"] ?? resolve(process.cwd(), "homeroom.db"),
    adapter:              (process.env["ADAPTER"] as Config["adapter"]) ?? "hermes",
    hermesCliPath:        process.env["HERMES_CLI_PATH"] ?? "hermes",
    hermesTimeoutSeconds: parseInt(process.env["HERMES_TIMEOUT_SECONDS"] ?? "120", 10),
    ollamaBaseUrl:        process.env["OLLAMA_BASE_URL"] ?? "http://127.0.0.1:11434",
    ollamaModel:          process.env["OLLAMA_MODEL"] ?? "nous-hermes2",
    cloudProvider:        process.env["CLOUD_PROVIDER"] ?? "openai",
    cloudModel:           process.env["CLOUD_MODEL"] ?? "gpt-4o",
    logLevel:             process.env["LOG_LEVEL"] ?? "info",
  };
}
