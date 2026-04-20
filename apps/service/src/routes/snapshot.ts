/**
 * snapshot.ts
 *
 *   GET /api/snapshot
 *
 * Returns the full canonical state plus the event cursor at which it was
 * captured. The frontend calls this on initial load and after any gap in
 * the SSE stream. The client uses the cursor to know which events to
 * replay if it reconnects.
 *
 * The shape matches the CanonicalState type in the v2 plan. All entities
 * are returned as arrays (client code keys them into Maps).
 */

import type { FastifyPluginAsync } from "fastify";
import type { AgentService } from "../services/agent-service.js";
import type { RunService } from "../services/run-service.js";
import type { ApprovalService } from "../services/approval-service.js";
import type { AuditService } from "../services/audit-service.js";
import type { RunStepRepo } from "../repos/run-step-repo.js";
import { currentSequence } from "../lib/event-bus.js";
import { toAgentSummaryView } from "../projectors/agent-views.js";
import { toRunView } from "../projectors/run-views.js";

export function buildSnapshotRoute(
  agentService: AgentService,
  runService: RunService,
  approvalService: ApprovalService,
  auditService: AuditService,
  runStepRepo: RunStepRepo,
  trustService: { findingsForAgent: (id: string) => unknown[] },
): FastifyPluginAsync {
  return async (app) => {
    app.get("/api/snapshot", async (_req, reply) => {
      const cursor = currentSequence();

      const agents = agentService.list();
      const agentViews = agents.map((a) => {
        const findings = trustService.findingsForAgent(a.id);
        return toAgentSummaryView(a, findings as never);
      });

      const runs = runService.listAll(200).map(toRunView);

      // Collect run steps for runs in this page
      const runSteps: Record<string, unknown[]> = {};
      for (const r of runs) {
        const steps = runStepRepo.findByRunId(r.id);
        if (steps.length > 0) runSteps[r.id] = steps;
      }

      const approvals = approvalService.listPending();
      const auditEvents = auditService.list(200);

      return reply.send({
        cursor,
        snapshotVersion: String(cursor),
        agents: agentViews,
        runs,
        runSteps,
        approvals,
        auditEvents,
      });
    });
  };
}
