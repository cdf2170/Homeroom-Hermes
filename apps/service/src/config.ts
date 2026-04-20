import { resolve } from "path";
import { homedir } from "os";

export interface Config {
  port: number;
  host: string;
  dbPath: string;
  adapter: "hermes" | "ollama" | "cloud";
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
  /** Path to the local Obsidian-compatible vault. Defaults to ~/.homeroom/vault */
  vaultPath: string;
  /** Path to the built frontend (vite build output). Defaults to <repo>/dist */
  staticRoot: string;
}

const VALID_ADAPTERS: Config["adapter"][] = ["hermes", "ollama", "cloud"];

function validateAdapter(raw: string | undefined): Config["adapter"] {
  if (!raw) return "hermes";
  if (raw === "mock") {
    console.warn(
      "[WARN] ADAPTER=mock is no longer supported for production use. Use ADAPTER=hermes. Falling back to hermes.",
    );
    return "hermes";
  }
  if (!VALID_ADAPTERS.includes(raw as Config["adapter"])) {
    throw new Error(`Unknown adapter "${raw}". Valid: ${VALID_ADAPTERS.join(", ")}`);
  }
  return raw as Config["adapter"];
}

export function loadConfig(): Config {
  return {
    port:                 parseInt(process.env["PORT"] ?? "5174", 10),
    host:                 process.env["HOST"] ?? "127.0.0.1",
    dbPath:               process.env["DB_PATH"] ?? resolve(process.cwd(), "homeroom.db"),
    adapter:              validateAdapter(process.env["ADAPTER"]),
    hermesCliPath:        process.env["HERMES_CLI_PATH"] ?? "hermes",
    hermesTimeoutSeconds: parseInt(process.env["HERMES_TIMEOUT_SECONDS"] ?? "120", 10),
    ollamaBaseUrl:        process.env["OLLAMA_BASE_URL"] ?? "http://127.0.0.1:11434",
    ollamaModel:          process.env["OLLAMA_MODEL"] ?? "nous-hermes2",
    cloudProvider:        process.env["CLOUD_PROVIDER"] ?? "openai",
    cloudModel:           process.env["CLOUD_MODEL"] ?? "gpt-4o",
    logLevel:             process.env["LOG_LEVEL"] ?? "info",
    vaultPath:            process.env["VAULT_PATH"] ?? resolve(homedir(), ".homeroom", "vault"),
    staticRoot:           process.env["STATIC_ROOT"] ?? resolve(process.cwd(), "..", "..", "dist"),
  };
}
