import type { FastifyPluginAsync } from "fastify";
import type { RuntimeService } from "../services/runtime-service.js";

export function buildRuntimeRoutes(runtimeService: RuntimeService): FastifyPluginAsync {
  return async (app) => {
    app.get("/api/runtime/health", async (_req, reply) => {
      const health = await runtimeService.health();
      return reply.send(health);
    });

    app.get("/api/runtime/models", async (_req, reply) => {
      const models = await runtimeService.listModels();
      return reply.send(models);
    });
  };
}
