import type { RunRepo } from "../repos/run-repo.js";
import type { AgentRepo } from "../repos/agent-repo.js";
import type { RuntimeProjectionRepo } from "../repos/runtime-projection-repo.js";
import type { RunStepRepo } from "../repos/run-step-repo.js";
import type { PermissionRepo } from "../repos/permission-repo.js";
import type { ApprovalService } from "./approval-service.js";
import type { AuditService } from "./audit-service.js";
import type { RuntimeAdapter } from "@homeroom/adapter-core";
import type { RunRecord } from "@homeroom/schemas";
import { emit, subscribe } from "../lib/event-bus.js";

type SceneState =
  | "idle" | "queued" | "working" | "waiting_approval" | "error" | "disabled";
type SceneRoomId =
  | "focus" | "mail" | "files" | "web" | "automation" | "outbox" | "waiting";

export function createRunService(
  runRepo: RunRepo,
  agentRepo: AgentRepo,
  runtimeProjectionRepo: RuntimeProjectionRepo,
  runStepRepo: RunStepRepo,
  permissionRepo: PermissionRepo,
  approvalService: ApprovalService,
  adapter: RuntimeAdapter,
  auditService: AuditService,
  /** Max seconds to wait for an adapter run to settle. Sourced from config. */
  timeoutSeconds: number,
) {
  /**
   * Single place where scene_state and scene_room_id are written. Updates the
   * agent row and emits an agent.transition event. All other code paths must
   * go through this helper so the UI can rely on sceneState/sceneRoomId being
   * the canonical answer to "where is this agent right now."
   */
  function transitionAgent(
    agentId: string,
    state: SceneState,
    roomId: SceneRoomId,
    reason?: string,
  ): void {
    agentRepo.update(agentId, {
      sceneState: state,
      sceneRoomId: roomId,
    } as Partial<Parameters<typeof agentRepo.update>[1]>);

    emit("agent.transition", {
      agentId,
      sceneState: state,
      sceneRoomId: roomId,
      reason,
    });
  }

  /**
   * Decide whether this run needs a pre-dispatch approval gate.
   *
   * Today this is the ONLY enforced approval path. It gates autonomous runs
   * (schedule / background / event triggers) when the agent's
   * requiresApprovalFor list contains one of: "schedule", "background",
   * or "autonomous".
   *
   * Manual triggers never gate here. Tool-level and mid-run gates
   * ("send", "network") are NOT enforced at dispatch because the backend
   * does not intercept adapter tool calls today.
   */
  function shouldGate(
    trigger: RunRecord["trigger"],
    agentId: string,
  ): { kind: "pre_dispatch"; reason: string } | null {
    const perms = permissionRepo.findByAgentId(agentId);
    if (!perms) return null;

    const gates = (perms.requiresApprovalFor ?? []) as string[];
    const isAutonomous = trigger === "schedule" || trigger === "background" || trigger === "event";
    const gatesAutonomous =
      gates.includes("schedule") ||
      gates.includes("background") ||
      gates.includes("autonomous");

    if (isAutonomous && gatesAutonomous) {
      return {
        kind: "pre_dispatch",
        reason: `Agent requires approval before ${trigger} runs.`,
      };
    }
    return null;
  }

  async function dispatch(record: RunRecord, agentId: string, input: string): Promise<void> {
    const agent = agentRepo.findById(agentId);
    const projection = runtimeProjectionRepo.findByAgentId(agentId);
    const backendRef = projection?.backendRef ?? agentId;
    const perms = permissionRepo.findByAgentId(agentId);
    const policy = {
      networkAccess: perms?.networkAccessMode ?? "off",
    };

    // Make sure the run is back in running state after an approval resume
    if (record.status !== "running") {
      runRepo.update(record.id, { status: "running" } as Partial<RunRecord>);
    }
    transitionAgent(agentId, "working", "focus", "run dispatched");

    try {
      const handle = await adapter.runAgent(backendRef, input, agent.modelRef ?? undefined, policy);
      runRepo.update(record.id, { backendRef: handle.runRef } as Partial<RunRecord>);

      const maxWaitMs = timeoutSeconds * 1000;
      const pollIntervalMs = 1000;
      const deadline = Date.now() + maxWaitMs;
      let settled = false;

      while (Date.now() < deadline) {
        await new Promise((r) => setTimeout(r, pollIntervalMs));
        try {
          const latest = await adapter.getRun(handle.runRef);
          if (latest.status === "running") continue;

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

          // Persist the final output as a single step so the trajectory has
          // at least one row. When hermes streaming is wired, the adapter
          // will emit multiple steps instead.
          if (finalStatus === "completed" && latest.outputSummary) {
            const step = runStepRepo.append(record.id, "message", latest.outputSummary.slice(0, 2000));
            emit("run.step", {
              runId: record.id,
              agentId,
              seq: step.seq,
              kind: step.kind,
              content: step.content,
            });
          } else if (latest.errorSummary) {
            const step = runStepRepo.append(record.id, "error", latest.errorSummary.slice(0, 2000));
            emit("run.step", {
              runId: record.id,
              agentId,
              seq: step.seq,
              kind: step.kind,
              content: step.content,
            });
          }

          if (finalStatus === "completed") {
            transitionAgent(agentId, "idle", "focus", "run.completed");
            emit("run.completed", { runId: record.id, agentId, status: finalStatus });
          } else {
            transitionAgent(agentId, "error", "focus", `run.${finalStatus}`);
            emit("run.failed", {
              runId: record.id,
              agentId,
              error: latest.errorSummary?.slice(0, 200) ?? "unknown",
            });
          }
          return;
        } catch {
          // Adapter poll error -- keep trying until deadline
        }
      }

      if (!settled) {
        runRepo.update(record.id, {
          status: "timeout",
          finishedAt: new Date().toISOString(),
          errorSummary: `Run timed out after ${timeoutSeconds}s without completing`,
        });
        agentRepo.update(agentId, {
          lastRunAt: new Date().toISOString(),
          lastRunStatus: "timeout",
        });
        auditService.append({
          actor: "system",
          sourceMode: "system",
          eventType: "run.timeout",
          targetType: "run",
          targetId: record.id,
          summary: `Run timed out for agent "${agent.name}" after ${timeoutSeconds}s`,
          permissionContext: null,
          runId: record.id,
        });
        transitionAgent(agentId, "error", "focus", "run.timeout");
        emit("run.timeout", { runId: record.id, agentId, timeoutSeconds });
      }
    } catch (err) {
      const errMsg = `Adapter error: ${String((err as Error)?.message ?? err).slice(0, 500)}`;
      runRepo.update(record.id, {
        status: "failed",
        finishedAt: new Date().toISOString(),
        errorSummary: errMsg,
      });
      agentRepo.update(agentId, {
        lastRunAt: new Date().toISOString(),
        lastRunStatus: "failed",
      });
      transitionAgent(agentId, "error", "focus", "adapter_error");
      emit("run.failed", { runId: record.id, agentId, error: errMsg.slice(0, 200) });
    }
  }

  // ── Listen for approval resolutions and resume/cancel the matching run ────
  subscribe((event) => {
    if (event.type !== "approval.resolved") return;
    const payload = event.payload as {
      approvalId: string;
      runId: string;
      agentId: string;
      resolution: string;
    };

    // Read the run; if it was cancelled externally, skip
    let run: RunRecord;
    try { run = runRepo.findById(payload.runId); }
    catch { return; }
    if (run.status !== "awaiting_approval") return;

    if (payload.resolution === "approve") {
      // Re-read the original input from the run record and resume
      const input = run.inputSummary ?? "";
      dispatch(run, payload.agentId, input).catch(() => {});
    } else {
      // Deny: cancel the run, return agent to idle
      runRepo.update(run.id, {
        status: "cancelled",
        finishedAt: new Date().toISOString(),
        errorSummary: "Denied by user",
      } as Partial<RunRecord>);
      agentRepo.update(payload.agentId, {
        lastRunAt: new Date().toISOString(),
        lastRunStatus: "cancelled",
      });
      auditService.append({
        actor: "user",
        sourceMode: "user",
        eventType: "run.failed",
        targetType: "run",
        targetId: run.id,
        summary: `Run cancelled by user (approval denied)`,
        permissionContext: null,
        runId: run.id,
      });
      transitionAgent(payload.agentId, "idle", "focus", "approval denied");
      emit("run.failed", { runId: run.id, agentId: payload.agentId, error: "Denied by user" });
    }
  });

  return {
    listAll(limit?: number): RunRecord[] {
      return runRepo.findAll(limit);
    },

    listForAgent(agentId: string, limit?: number): RunRecord[] {
      agentRepo.findById(agentId);
      return runRepo.findByAgentId(agentId, limit);
    },

    getById(id: string): RunRecord {
      return runRepo.findById(id);
    },

    async start(agentId: string, input: string, trigger: RunRecord["trigger"] = "manual"): Promise<RunRecord> {
      const agent = agentRepo.findById(agentId);
      const gate = shouldGate(trigger, agentId);

      // Create the run record up front either way
      const record = runRepo.insert({
        agentId,
        trigger,
        status: gate ? "awaiting_approval" : "running",
        finishedAt: null,
        inputSummary: input.slice(0, 1000),
        outputSummary: "",
        errorSummary: null,
        backendRef: null,
      });

      auditService.append({
        actor: trigger === "schedule" ? "system" : "user",
        sourceMode: trigger === "schedule" ? "system" : "user",
        eventType: "run.started",
        targetType: "run",
        targetId: record.id,
        summary: `Run ${gate ? "queued for approval" : "started"} for agent "${agent.name}" (${trigger})`,
        permissionContext: null,
        runId: record.id,
      });
      emit("run.started", { runId: record.id, agentId, trigger });

      if (gate) {
        // Hold at the waiting gate; create the approval record. When the user
        // resolves it, the approval.resolved listener above will resume or
        // cancel this run.
        approvalService.request({
          runId: record.id,
          agentId,
          kind: gate.kind,
          reason: gate.reason,
          preview: { kind: "text", body: input.slice(0, 500) },
        });
        transitionAgent(agentId, "waiting_approval", "waiting", gate.reason);
        return record;
      }

      transitionAgent(agentId, "working", "focus", `run.started (${trigger})`);
      // Fire-and-forget dispatch
      dispatch(record, agentId, input).catch(() => {});
      return record;
    },
  };
}

export type RunService = ReturnType<typeof createRunService>;
