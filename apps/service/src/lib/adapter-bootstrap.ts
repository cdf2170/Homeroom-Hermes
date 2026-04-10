import type { RuntimeAdapter } from "@homeroom/adapter-core";
import { MockOpenClawAdapter } from "@homeroom/adapter-openclaw";
import type { Config } from "../config.js";

export function buildAdapter(config: Config): RuntimeAdapter {
  switch (config.adapter) {
    case "mock":
      return new MockOpenClawAdapter();
    default:
      throw new Error(`Unknown adapter: ${config.adapter}`);
  }
}
