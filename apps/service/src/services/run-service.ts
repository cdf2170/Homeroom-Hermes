import type { RunRepo } from "../repos/run-repo.js";
import type { AgentRepo } from "../repos/agent-repo.js";
import type { RuntimeProjectionRepo } from "../repos/runtime-projection-repo.js";
import type { AuditService } from "./audit-service.js";
import type { RuntimeAdapter } from "@homeroom/adapter-core";
import type { RunRecord } from "@homeroom/schemas";
import { NotFoundError } from "../lib/errors.js";

export function createRunService(
  runRepo: RunRepo,
  agentRepo: AgentRepo,
  runtimeProjectionRepo: RuntimeProjectionRepo,
  adapter: RuntimeAdapter,
  auditService: AuditService,
) {
  return {
    listAll(limit?: number): RunRecord[] {
      return runRepo.findAll(limit);
    },

    listForAgent(agentId: string, limit?: number): RunRecord[] {
      agentRepo.findById(agentId); // throws if not found
      return runRepo.findByAgentId(agentId, limit);
    },

    getById(id: string): RunRecord {
      return runRepo.findById(id);
    },

    async start(agentId: string, input: string): Promise<RunRecord> {
      const agent = agentRepo.findById(agentId);

      const projection = runtimeProjectionRepo.findByAgentId(agentId);
      const backendRef = projection?.backendRef ?? agentId; // fallback for mock

      // Create local record immediately
      const record = runRepo.insert({
        agentId,
        trigger: "manual",
        status: "running",
        finishedAt: null,
        inputSummary: input.slice(0, 1000),
        outputSummary: "",
        errorSummary: null,
        backendRef: null,
      });

      auditService.append({
        actor: "user",
        sourceMode: "user",
        eventType: "run.started",
        targetType: "run",
        targetId: record.id,
        summary: `Run started for agent "${agent.name}"`,
        permissionContext: null,
        runId: record.id,
      });

      // Kick off adapter run (fire-and-forget; poll in background)
      const timeoutSeconds = 120;
      adapter.runAgent(backendRef, input, agent.modelRef ?? undefined).then(async (handle) => {
        // Attach the adapter ref
        runRepo.update(record.id, { backendRef: handle.runRef } as Partial<RunRecord>);

        // Poll until the adapter settles
        const maxWaitMs = timeoutSeconds * 1000;
        const pollIntervalMs = 1000;
        const deadline = Date.now() + maxWaitMs;
        let settled = false;

        while (Date.now() < deadline) {
          await new Promise((r) => setTimeout(r, pollIntervalMs));
          try {
            const latest = await adapter.getRun(handle.runRef);
            if (latest.status === "running") continue;

            // Settled
            settled = true;
            const finalStatus = latest.status as RunRecord["status"];
            runRepo.update(record.id, {
              status: finalStatus,
              finishedAt: latest.finishedAt ?? new Date().toISOString(),
              outputSummary: latest.outputSummary.slice(0, 2000),
              errorSummary: latest.errorSummary?.slice(0, 2000) ?? null,
            });

            agentRepo.update(agentId, {
              lastRunAt: latest.finishedAt ?? new Date().toISOString(),
              lastRunStatus: finalStatus,
            });

            auditService.append({
              actor: "system",
              sourceMode: "system",
              eventType: finalStatus === "completed" ? "run.completed" : "run.failed",
              targetType: "run",
              targetId: record.id,
              summary: `Run ${finalStatus} for agent "${agent.name}"`,
              permissionContext: null,
              runId: record.id,
            });
            break;
          } catch {
            // Adapter poll error — keep trying until deadline
          }
        }

        // If we hit the deadline without settling, persist timeout as failure
        if (!settled) {
          runRepo.update(record.id, {
            status: "failed",
            finishedAt: new Date().toISOString(),
            errorSummary: `Run timed out after ${timeoutSeconds}s without completing`,
          });
          agentRepo.update(agentId, {
            lastRunAt: new Date().toISOString(),
            lastRunStatus: "failed",
          });
          auditService.append({
            actor: "system",
            sourceMode: "system",
            eventType: "run.failed",
            targetType: "run",
            targetId: record.id,
            summary: `Run timed out for agent "${agent.name}" after ${timeoutSeconds}s`,
            permissionContext: null,
            runId: record.id,
          });
        }
      }).catch((err) => {
        runRepo.update(record.id, {
          status: "failed",
          finishedAt: new Date().toISOString(),
          errorSummary: `Adapter error: ${String(err?.message ?? err).slice(0, 500)}`,
        });
        agentRepo.update(agentId, {
          lastRunAt: new Date().toISOString(),
          lastRunStatus: "failed",
        });
      });

      return record;
    },
  };
}

export type RunService = ReturnType<typeof createRunService>;
