import { z } from "zod";
import { SafetyLevel } from "./enums.js";

export const PermissionProfileSchema = z.object({
  id: z.string().uuid(),
  agentId: z.string().uuid(),
  safetyLevel: SafetyLevel.default("strict"),
  toolScopes: z.array(z.string()).default([]),
  dataScopes: z.array(z.string()).default([]),
  networkAccess: z.boolean().default(false),
  requiresApprovalFor: z.array(z.string()).default(["file:write", "shell:exec"]),
  backgroundAllowed: z.boolean().default(false),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});
export type PermissionProfile = z.infer<typeof PermissionProfileSchema>;
