import type { FastifyPluginAsync } from "fastify";
import type { FrontdeskService } from "../services/frontdesk-service.js";

export function buildFrontdeskRoutes(frontdeskService: FrontdeskService): FastifyPluginAsync {
  return async (app) => {
    app.get("/api/frontdesk/summary", async (_req, reply) => {
      const summary = await frontdeskService.summary();
      return reply.send(summary);
    });
  };
}
