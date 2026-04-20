/**
 * approvals.ts
 *
 *   GET  /api/approvals               -- pending approvals across all agents
 *   GET  /api/approvals?status=pending
 *   GET  /api/approvals/:id
 *   POST /api/approvals/:id/resolve   body: { resolution: "approve" | "deny" }
 */

import type { FastifyPluginAsync } from "fastify";
import type { ApprovalService } from "../services/approval-service.js";
import { ServiceError } from "../lib/errors.js";

export function buildApprovalsRoutes(approvalService: ApprovalService): FastifyPluginAsync {
  return async (app) => {
    app.get<{ Querystring: { status?: string; agentId?: string } }>(
      "/api/approvals",
      async (req, reply) => {
        const { status, agentId } = req.query;
        if (agentId) {
          return reply.send(approvalService.listForAgent(agentId));
        }
        if (status === "pending" || !status) {
          return reply.send(approvalService.listPending());
        }
        return reply.code(400).send({
          error: "INVALID_STATUS",
          message: "status must be 'pending' or omitted",
        });
      },
    );

    app.get<{ Params: { id: string } }>("/api/approvals/:id", async (req, reply) => {
      return reply.send(approvalService.getById(req.params.id));
    });

    app.post<{
      Params: { id: string };
      Body: { resolution?: string };
    }>("/api/approvals/:id/resolve", async (req, reply) => {
      const { resolution } = req.body ?? {};
      if (resolution !== "approve" && resolution !== "deny") {
        throw new ServiceError(
          "resolution must be 'approve' or 'deny'",
          "VALIDATION_ERROR",
          400,
        );
      }
      const resolved = approvalService.resolve(req.params.id, resolution);
      return reply.send(resolved);
    });
  };
}
