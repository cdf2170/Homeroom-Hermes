import type { RuntimeAdapter } from "@homeroom/adapter-core";
import { HermesAdapter, MockOpenClawAdapter } from "@homeroom/adapter-hermes";
import { OllamaAdapter } from "@homeroom/adapter-ollama";
import { CloudAdapter } from "@homeroom/adapter-cloud";
import { getCredential } from "./credentials.js";
import type { Config } from "../config.js";

export async function buildAdapter(config: Config): Promise<RuntimeAdapter> {
  switch (config.adapter) {
    case "hermes":
      return new HermesAdapter({
        cliPath:        config.hermesCliPath,
        timeoutSeconds: config.hermesTimeoutSeconds,
        getProviderKey: getCredential,
      });
    case "mock":
      return new MockOpenClawAdapter();
    case "ollama":
      return new OllamaAdapter({
        baseUrl: config.ollamaBaseUrl,
        model:   config.ollamaModel,
      });
    case "cloud": {
      const provider = config.cloudProvider as "openai" | "anthropic" | "google" | "mistral";
      const apiKey = (await getCredential(provider)) ?? "";
      return new CloudAdapter({
        provider,
        model:  config.cloudModel,
        apiKey,
      });
    }
    default:
      throw new Error(`Unknown adapter: ${config.adapter}`);
  }
}
