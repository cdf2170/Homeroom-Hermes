import type { FastifyPluginAsync } from "fastify";
import type { AuditService } from "../services/audit-service.js";

export function buildAuditRoutes(auditService: AuditService): FastifyPluginAsync {
  return async (app) => {
    app.get<{ Querystring: { limit?: string } }>("/api/audit", async (req, reply) => {
      const limit = req.query.limit ? parseInt(req.query.limit, 10) : 100;
      return reply.send(auditService.list(limit));
    });
  };
}
