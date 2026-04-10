import { z } from "zod";

export const RuntimeProjectionSchema = z.object({
  agentId: z.string().uuid(),
  backendRef: z.string().nullable().default(null),
  modelRef: z.string().nullable().default(null),
  providerRef: z.string().nullable().default(null),
  state: z
    .enum(["unknown", "idle", "running", "error", "not_found"])
    .default("unknown"),
  currentRunId: z.string().nullable().default(null),
  schedulerState: z.enum(["inactive", "active", "paused", "error"]).default("inactive"),
  workspacePath: z.string().nullable().default(null),
  lastSyncedAt: z.string().datetime().nullable().default(null),
});

export type RuntimeProjection = z.infer<typeof RuntimeProjectionSchema>;
