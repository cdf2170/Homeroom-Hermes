/**
 * mirror.ts
 *
 * Routes for the local markdown mirror. Canonical paths are /api/mirror/*.
 * Legacy paths /api/vault/* are registered as aliases so existing clients
 * keep working during the rename.
 */

import type { FastifyPluginAsync } from "fastify";
import type { MirrorService } from "../services/mirror-service.js";
import type { AgentService } from "../services/agent-service.js";
import type { MemoryRepo } from "../repos/memory-repo.js";
import type { RuleRepo } from "../repos/rule-repo.js";
import type { PermissionRepo } from "../repos/permission-repo.js";
import type { ScheduleRepo } from "../repos/schedule-repo.js";
import type { RunRepo } from "../repos/run-repo.js";

export function buildMirrorRoutes(
  mirrorService: MirrorService,
  agentService: AgentService,
  memoryRepo: MemoryRepo,
  ruleRepo: RuleRepo,
  permissionRepo: PermissionRepo,
  scheduleRepo: ScheduleRepo,
  runRepo: RunRepo,
): FastifyPluginAsync {
  return async (app) => {
    // ── Handlers ─────────────────────────────────────────────────────────────

    const overallStatus = async (_req: unknown, reply: { send: (x: unknown) => unknown }) => {
      const statuses = mirrorService.getAllStatuses();
      return reply.send({
        // Include both keys so clients on either name keep working.
        mirrorRoot: mirrorService.mirrorRoot,
        vaultRoot: mirrorService.mirrorRoot,
        agents: statuses,
      });
    };

    const agentStatus = async (
      req: { params: { id: string } },
      reply: { send: (x: unknown) => unknown },
    ) => {
      const { id } = req.params;
      agentService.getById(id); // throws 404 if not found
      const status = mirrorService.getStatus(id);

      const detail = agentService.getDetail(id);
      const runs = runRepo.findByAgentId(id, 20).map((r) => ({
        id: r.id,
        status: r.status,
        trigger: r.trigger,
        startedAt: r.startedAt,
        finishedAt: r.finishedAt,
        inputSummary: r.inputSummary ?? "",
        outputSummary: r.outputSummary,
        errorSummary: r.errorSummary,
      }));
      const expectedHash = mirrorService.computeHash(
        detail.profile,
        detail.memoryItems as never,
        detail.ruleItems as never,
        detail.permissionProfile as never,
        detail.schedule as never,
        runs,
      );

      const drift = mirrorService.getDriftStatus(detail.profile.name, id, expectedHash);

      return reply.send({
        ...status,
        mirrorRoot: mirrorService.mirrorRoot,
        vaultRoot: mirrorService.mirrorRoot,
        expectedHash,
        diskHash: drift.diskHash,
        driftStatus: drift.status,
        inSync: drift.status === "in-sync",
      });
    };

    const rebuildAll = async (_req: unknown, reply: { send: (x: unknown) => unknown }) => {
      const agents = agentService.list();
      for (const profile of agents) {
        const id = profile.id;
        const memoryItems = memoryRepo.findByAgentId(id);
        const ruleItems = ruleRepo.findByAgentId(id);
        const perm = permissionRepo.findByAgentId(id);
        const schedule = scheduleRepo.findByAgentId(id);
        const runs = runRepo.findByAgentId(id, 20).map((r) => ({
          id: r.id,
          status: r.status,
          trigger: r.trigger,
          startedAt: r.startedAt,
          finishedAt: r.finishedAt,
          inputSummary: r.inputSummary ?? "",
          outputSummary: r.outputSummary,
          errorSummary: r.errorSummary,
        }));
        mirrorService.invalidate(id);
        mirrorService.syncAgent(
          profile,
          memoryItems as never,
          ruleItems as never,
          perm as never,
          schedule as never,
          runs,
        );
      }
      return reply.send({ rebuilt: agents.length });
    };

    const rebuildOne = async (
      req: { params: { id: string } },
      reply: { send: (x: unknown) => unknown },
    ) => {
      const { id } = req.params;
      const detail = agentService.getDetail(id);
      const runs = runRepo.findByAgentId(id, 20).map((r) => ({
        id: r.id,
        status: r.status,
        trigger: r.trigger,
        startedAt: r.startedAt,
        finishedAt: r.finishedAt,
        inputSummary: r.inputSummary ?? "",
        outputSummary: r.outputSummary,
        errorSummary: r.errorSummary,
      }));
      mirrorService.invalidate(id);
      mirrorService.syncAgent(
        detail.profile,
        detail.memoryItems as never,
        detail.ruleItems as never,
        detail.permissionProfile as never,
        detail.schedule as never,
        runs,
      );
      return reply.send({ rebuilt: true, agentId: id });
    };

    // ── Canonical paths ──────────────────────────────────────────────────────
    app.get("/api/mirror/status", overallStatus as never);
    app.get<{ Params: { id: string } }>("/api/mirror/status/:id", agentStatus as never);
    app.post("/api/mirror/rebuild", rebuildAll as never);
    app.post<{ Params: { id: string } }>("/api/mirror/rebuild/:id", rebuildOne as never);

    // ── Legacy aliases (kept for back-compat) ────────────────────────────────
    app.get("/api/vault/status", overallStatus as never);
    app.get<{ Params: { id: string } }>("/api/vault/status/:id", agentStatus as never);
    app.post("/api/vault/rebuild", rebuildAll as never);
    app.post<{ Params: { id: string } }>("/api/vault/rebuild/:id", rebuildOne as never);
  };
}

/** @deprecated Use buildMirrorRoutes. */
export const buildVaultRoutes = buildMirrorRoutes;
