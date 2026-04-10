import { z } from "zod";
import { SourceMode, AuditEventType, TargetType } from "./enums.js";

export const AuditEventSchema = z.object({
  id: z.string().uuid(),
  actor: z.string().max(128),
  sourceMode: SourceMode,
  eventType: AuditEventType,
  targetType: TargetType,
  targetId: z.string().uuid(),
  timestamp: z.string().datetime(),
  summary: z.string().max(500),
  permissionContext: z.record(z.unknown()).nullable().default(null),
  runId: z.string().uuid().nullable().default(null),
});
export type AuditEvent = z.infer<typeof AuditEventSchema>;
