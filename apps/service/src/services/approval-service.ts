/**
 * approval-service.ts
 *
 * Creates and resolves approval records. Called by run-service pre-dispatch
 * when a run is blocked on a permission gate, and by the API route when the
 * user clicks approve/deny.
 *
 * Resolving an approval emits `approval.resolved` on the event bus; the
 * run-service listener is responsible for either proceeding with the run
 * (on approve) or cancelling it (on deny).
 */

import type { ApprovalRepo, Approval, ApprovalKind, ApprovalPreview } from "../repos/approval-repo.js";
import type { RunRepo } from "../repos/run-repo.js";
import type { AuditService } from "./audit-service.js";
import { emit } from "../lib/event-bus.js";
import { ServiceError } from "../lib/errors.js";

export function createApprovalService(
  approvalRepo: ApprovalRepo,
  runRepo: RunRepo,
  auditService: AuditService,
) {
  return {
    listPending(): Approval[] {
      return approvalRepo.listPending();
    },

    listForAgent(agentId: string): Approval[] {
      return approvalRepo.listForAgent(agentId);
    },

    getById(id: string): Approval {
      return approvalRepo.findById(id);
    },

    /** Request approval. Called by run-service pre-dispatch. */
    request(data: {
      runId: string;
      agentId: string;
      kind: ApprovalKind;
      reason: string;
      preview: ApprovalPreview | null;
    }): Approval {
      const approval = approvalRepo.insert(data);

      auditService.append({
        actor: "system",
        sourceMode: "system",
        eventType: "approval.requested",
        targetType: "approval",
        targetId: approval.id,
        summary: `Approval requested for run "${approval.runId}" (${approval.kind}): ${approval.reason.slice(0, 160)}`,
        permissionContext: null,
        runId: approval.runId,
      });

      emit("approval.requested", {
        approvalId: approval.id,
        runId: approval.runId,
        agentId: approval.agentId,
        kind: approval.kind,
        reason: approval.reason,
      });

      return approval;
    },

    /** Resolve an approval. Called by the user via the API. */
    resolve(id: string, resolution: "approve" | "deny"): Approval {
      const existing = approvalRepo.findById(id);
      if (existing.resolution != null) {
        throw new ServiceError(
          `Approval ${id} is already resolved as ${existing.resolution}`,
          "ALREADY_RESOLVED",
          409,
        );
      }
      // Verify the run still exists (a deleted agent may have removed it)
      runRepo.findById(existing.runId);

      const resolved = approvalRepo.resolve(id, resolution);

      auditService.append({
        actor: "user",
        sourceMode: "user",
        eventType: "approval.resolved",
        targetType: "approval",
        targetId: resolved.id,
        summary: `Approval ${resolution}d for run "${resolved.runId}"`,
        permissionContext: null,
        runId: resolved.runId,
      });

      emit("approval.resolved", {
        approvalId: resolved.id,
        runId: resolved.runId,
        agentId: resolved.agentId,
        resolution,
      });

      return resolved;
    },
  };
}

export type ApprovalService = ReturnType<typeof createApprovalService>;
