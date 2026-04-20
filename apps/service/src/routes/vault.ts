import type { FastifyPluginAsync } from "fastify";
import type { VaultService } from "../services/vault-service.js";
import type { AgentService } from "../services/agent-service.js";
import type { MemoryRepo } from "../repos/memory-repo.js";
import type { RuleRepo } from "../repos/rule-repo.js";
import type { PermissionRepo } from "../repos/permission-repo.js";
import type { ScheduleRepo } from "../repos/schedule-repo.js";
import type { RunRepo } from "../repos/run-repo.js";
import { ServiceError } from "../lib/errors.js";

export function buildVaultRoutes(
  vaultService: VaultService,
  agentService: AgentService,
  memoryRepo: MemoryRepo,
  ruleRepo: RuleRepo,
  permissionRepo: PermissionRepo,
  scheduleRepo: ScheduleRepo,
  runRepo: RunRepo,
): FastifyPluginAsync {
  return async (app) => {
    // GET /api/vault/status — overall vault status
    app.get("/api/vault/status", async (_req, reply) => {
      const statuses = vaultService.getAllStatuses();
      return reply.send({
        vaultRoot: vaultService.vaultRoot,
        agents: statuses,
      });
    });

    // GET /api/vault/status/:id — per-agent vault status with real drift detection
    app.get<{ Params: { id: string } }>("/api/vault/status/:id", async (req, reply) => {
      const { id } = req.params;
      const agent = agentService.getById(id); // throws 404 if not found
      const status = vaultService.getStatus(id);

      // Compute what the backend would generate right now
      const detail = agentService.getDetail(id);
      const runs = runRepo.findByAgentId(id, 20).map(r => ({
        id: r.id,
        status: r.status,
        trigger: r.trigger,
        startedAt: r.startedAt,
        finishedAt: r.finishedAt,
        inputSummary: r.inputSummary ?? "",
        outputSummary: r.outputSummary,
        errorSummary: r.errorSummary,
      }));
      const expectedHash = vaultService.computeHash(
        detail.profile,
        detail.memoryItems as any,
        detail.ruleItems as any,
        detail.permissionProfile as any,
        detail.schedule as any,
        runs,
      );

      // Real on-disk drift detection
      const drift = vaultService.getDriftStatus(
        detail.profile.name,
        id,
        expectedHash,
      );

      return reply.send({
        ...status,
        vaultRoot: vaultService.vaultRoot,
        expectedHash,
        diskHash: drift.diskHash,
        driftStatus: drift.status,
        // Legacy compat: inSync is true only when everything matches
        inSync: drift.status === "in-sync",
      });
    });

    // POST /api/vault/rebuild — regenerate all agent docs
    app.post("/api/vault/rebuild", async (_req, reply) => {
      const agents = agentService.list();
      for (const profile of agents) {
        const id = profile.id;
        const memoryItems = memoryRepo.findByAgentId(id);
        const ruleItems   = ruleRepo.findByAgentId(id);
        const perm        = permissionRepo.findByAgentId(id);
        const schedule    = scheduleRepo.findByAgentId(id);
        const runs        = runRepo.findByAgentId(id, 20).map(r => ({
          id: r.id,
          status: r.status,
          trigger: r.trigger,
          startedAt: r.startedAt,
          finishedAt: r.finishedAt,
          inputSummary: r.inputSummary ?? "",
          outputSummary: r.outputSummary,
          errorSummary: r.errorSummary,
        }));
        vaultService.invalidate(id);
        vaultService.syncAgent(profile, memoryItems as any, ruleItems as any, perm as any, schedule as any, runs);
      }
      return reply.send({ rebuilt: agents.length });
    });

    // POST /api/vault/rebuild/:id — regenerate one agent's docs
    app.post<{ Params: { id: string } }>("/api/vault/rebuild/:id", async (req, reply) => {
      const { id } = req.params;
      const detail = agentService.getDetail(id);
      const runs   = runRepo.findByAgentId(id, 20).map(r => ({
        id: r.id,
        status: r.status,
        trigger: r.trigger,
        startedAt: r.startedAt,
        finishedAt: r.finishedAt,
        inputSummary: r.inputSummary ?? "",
        outputSummary: r.outputSummary,
        errorSummary: r.errorSummary,
      }));
      vaultService.invalidate(id);
      vaultService.syncAgent(
        detail.profile,
        detail.memoryItems as any,
        detail.ruleItems as any,
        detail.permissionProfile as any,
        detail.schedule as any,
        runs,
      );
      return reply.send({ rebuilt: true, agentId: id });
    });
  };
}
