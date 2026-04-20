import type { FastifyPluginAsync } from "fastify";
import type { AgentService } from "../services/agent-service.js";
import type { RunService } from "../services/run-service.js";
import type { ScheduleService } from "../services/schedule-service.js";
import type { TrustService } from "../services/trust-service.js";
import type { AuditService } from "../services/audit-service.js";
import type { RunStepRepo } from "../repos/run-step-repo.js";
import {
  CreateAgentRequest,
  UpdateAgentRequest,
  RunAgentRequest,
  UpdateScheduleRequest,
} from "@homeroom/contracts";
import { toAgentSummaryView, toAgentDetailView } from "../projectors/agent-views.js";
import { toRunView } from "../projectors/run-views.js";
import { ServiceError } from "../lib/errors.js";

export function buildAgentRoutes(
  agentService: AgentService,
  runService: RunService,
  scheduleService: ScheduleService,
  trustService: TrustService,
  auditService: AuditService,
  runStepRepo: RunStepRepo,
): FastifyPluginAsync {
  return async (app) => {
    // GET /api/agents
    app.get("/api/agents", async (_req, reply) => {
      const agents = agentService.list();
      const views = agents.map((a) => {
        const findings = trustService.findingsForAgent(a.id);
        return toAgentSummaryView(a, findings);
      });
      return reply.send(views);
    });

    // POST /api/agents
    app.post("/api/agents", async (req, reply) => {
      const parsed = CreateAgentRequest.safeParse(req.body);
      if (!parsed.success) throw new ServiceError(parsed.error.message, "VALIDATION_ERROR", 400);
      const agent = await agentService.create(parsed.data);
      const detail = agentService.getDetail(agent.id);
      return reply.code(201).send(
        toAgentDetailView(
          detail.profile,
          detail.memoryItems,
          detail.ruleItems,
          detail.permissionProfile,
          detail.schedule,
          detail.runtime,
          detail.trustFindings,
        ),
      );
    });

    // GET /api/agents/:id
    app.get<{ Params: { id: string } }>("/api/agents/:id", async (req, reply) => {
      const { id } = req.params;
      const detail = agentService.getDetail(id);
      return reply.send(
        toAgentDetailView(
          detail.profile,
          detail.memoryItems,
          detail.ruleItems,
          detail.permissionProfile,
          detail.schedule,
          detail.runtime,
          detail.trustFindings,
        ),
      );
    });

    // PATCH /api/agents/:id
    app.patch<{ Params: { id: string } }>("/api/agents/:id", async (req, reply) => {
      const { id } = req.params;
      const parsed = UpdateAgentRequest.safeParse(req.body);
      if (!parsed.success) throw new ServiceError(parsed.error.message, "VALIDATION_ERROR", 400);
      await agentService.update(id, parsed.data);
      const detail = agentService.getDetail(id);
      return reply.send(
        toAgentDetailView(
          detail.profile,
          detail.memoryItems,
          detail.ruleItems,
          detail.permissionProfile,
          detail.schedule,
          detail.runtime,
          detail.trustFindings,
        ),
      );
    });

    // DELETE /api/agents/:id
    app.delete<{ Params: { id: string } }>("/api/agents/:id", async (req, reply) => {
      await agentService.delete(req.params.id);
      return reply.code(204).send();
    });

    // POST /api/agents/:id/run
    app.post<{ Params: { id: string } }>("/api/agents/:id/run", async (req, reply) => {
      const { id } = req.params;
      const parsed = RunAgentRequest.safeParse(req.body ?? {});
      if (!parsed.success) throw new ServiceError(parsed.error.message, "VALIDATION_ERROR", 400);
      const run = await runService.start(id, parsed.data.input);
      return reply.code(202).send(toRunView(run));
    });

    // GET /api/agents/:id/runs
    app.get<{ Params: { id: string } }>("/api/agents/:id/runs", async (req, reply) => {
      const runs = runService.listForAgent(req.params.id);
      return reply.send(runs.map(toRunView));
    });

    // GET /api/agents/:id/activity
    app.get<{ Params: { id: string } }>("/api/agents/:id/activity", async (req, reply) => {
      const events = auditService.listForTarget("agent", req.params.id);
      return reply.send(events);
    });

    // PUT /api/agents/:id/schedule
    app.put<{ Params: { id: string } }>("/api/agents/:id/schedule", async (req, reply) => {
      const { id } = req.params;
      const parsed = UpdateScheduleRequest.safeParse(req.body);
      if (!parsed.success) throw new ServiceError(parsed.error.message, "VALIDATION_ERROR", 400);
      const schedule = scheduleService.upsert(id, parsed.data);
      return reply.send(schedule);
    });

    // GET /api/agents/:id/trust
    app.get<{ Params: { id: string } }>("/api/agents/:id/trust", async (req, reply) => {
      const findings = trustService.findingsForAgent(req.params.id);
      return reply.send(findings);
    });

    // GET /api/runs — global run history across all agents
    app.get<{ Querystring: { limit?: string } }>("/api/runs", async (req, reply) => {
      const limit = req.query.limit ? parseInt(req.query.limit, 10) : 100;
      return reply.send(runService.listAll(limit).map(toRunView));
    });

    // GET /api/runs/:id/steps — step-level trace for one run
    app.get<{ Params: { id: string } }>("/api/runs/:id/steps", async (req, reply) => {
      // Throws if run not found
      runService.getById(req.params.id);
      return reply.send(runStepRepo.findByRunId(req.params.id));
    });
  };
}
