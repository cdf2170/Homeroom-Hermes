import type { AuditRepo } from "../repos/audit-repo.js";
import type { AuditEvent } from "@homeroom/schemas";

export function createAuditService(auditRepo: AuditRepo) {
  return {
    append(event: Omit<AuditEvent, "id" | "timestamp">): AuditEvent {
      return auditRepo.append(event);
    },

    listForTarget(targetType: string, targetId: string, limit?: number): AuditEvent[] {
      return auditRepo.findByTarget(targetType, targetId, limit);
    },

    list(limit?: number): AuditEvent[] {
      return auditRepo.findAll(limit);
    },
  };
}

export type AuditService = ReturnType<typeof createAuditService>;
