import type { RuntimeAdapter } from "@homeroom/adapter-core";
import type { RuntimeHealth } from "@homeroom/schemas";
import type { AdapterModelInfo } from "@homeroom/adapter-core";

export function createRuntimeService(adapter: RuntimeAdapter) {
  return {
    async health(): Promise<RuntimeHealth> {
      const h = await adapter.health();
      return {
        openclawInstalled: h.openclawInstalled,
        gatewayReachable: h.gatewayReachable,
        schedulerReachable: h.schedulerReachable,
        modelsAvailable: h.modelsAvailable,
        homeroomServiceMode: "local",
        warnings: h.warnings,
        checkedAt: h.checkedAt,
      };
    },

    async listModels(): Promise<AdapterModelInfo[]> {
      return adapter.listModels();
    },
  };
}

export type RuntimeService = ReturnType<typeof createRuntimeService>;
