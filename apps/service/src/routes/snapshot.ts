/**
 * snapshot.ts
 *
 *   GET /api/recent-state
 *
 * Returns the most recent slice of canonical state plus the event cursor
 * at which it was captured. This is what the frontend calls on initial load
 * to paint the office quickly.
 *
 *   Scope                  Included
 *   ---------------------  ----------------------------------------------
 *   agents                 all (typically small)
 *   runs                   last 200, most recent first
 *   runSteps               only for the returned runs
 *   approvals              all currently pending
 *   auditEvents            last 200, most recent first
 *
 * This is deliberately NOT a full canonical snapshot. For full replay of
 * history, use GET /api/events?since=<seq> against the durable event log.
 *
 * The legacy path /api/snapshot remains as an alias so existing clients
 * keep working while they migrate.
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

const RECENT_RUN_LIMIT = 200;
const RECENT_AUDIT_LIMIT = 200;

export function buildSnapshotRoute(
  agentService: AgentService,
  runService: RunService,
  approvalService: ApprovalService,
  auditService: AuditService,
  runStepRepo: RunStepRepo,
  trustService: { findingsForAgent: (id: string) => unknown[] },
): FastifyPluginAsync {
  return async (app) => {
    const handler = async (_req: unknown, reply: { send: (x: unknown) => unknown }) => {
      const cursor = currentSequence();

      const agents = agentService.list();
      const agentViews = agents.map((a) => {
        const findings = trustService.findingsForAgent(a.id);
        return toAgentSummaryView(a, findings as never);
      });

      const runs = runService.listAll(RECENT_RUN_LIMIT).map(toRunView);

      const runSteps: Record<string, unknown[]> = {};
      for (const r of runs) {
        const steps = runStepRepo.findByRunId(r.id);
        if (steps.length > 0) runSteps[r.id] = steps;
      }

      const approvals = approvalService.listPending();
      const auditEvents = auditService.list(RECENT_AUDIT_LIMIT);

      return reply.send({
        cursor,
        snapshotVersion: String(cursor),
        /**
         * Bounds applied to this view. Clients needing full history should
         * fetch /api/events?since=0 or paginate per-entity endpoints.
         */
        scope: {
          runs: { limit: RECENT_RUN_LIMIT, returned: runs.length },
          auditEvents: { limit: RECENT_AUDIT_LIMIT, returned: auditEvents.length },
          approvals: { filter: "pending", returned: approvals.length },
          runSteps: { filter: `only for the ${runs.length} recent runs above` },
        },
        agents: agentViews,
        runs,
        runSteps,
        approvals,
        auditEvents,
      });
    };

    // Canonical path: honest name.
    app.get("/api/recent-state", handler as never);

    // Backward-compatible alias.
    app.get("/api/snapshot", handler as never);
  };
}
