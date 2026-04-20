import { z } from "zod";
import { SafetyLevel } from "./enums.js";

/**
 * Network access is enforced at dispatch time by spawning hermes with a dead
 * proxy when the mode is 'off'. 'limited' is a placeholder for future scoped
 * network access (allowlist) and currently behaves like 'open'.
 */
export const NetworkAccessMode = z.enum(["off", "limited", "open"]);
export type NetworkAccessMode = z.infer<typeof NetworkAccessMode>;

export const PermissionProfileSchema = z.object({
  id: z.string().uuid(),
  agentId: z.string().uuid(),
  safetyLevel: SafetyLevel.default("strict"),
  toolScopes: z.array(z.string()).default([]),
  dataScopes: z.array(z.string()).default([]),
  /** Legacy boolean mirror of networkAccessMode !== 'off'. Kept for back-compat. */
  networkAccess: z.boolean().default(false),
  /** Canonical field. Enforced in the hermes adapter at dispatch. */
  networkAccessMode: NetworkAccessMode.default("off"),
  requiresApprovalFor: z.array(z.string()).default(["file:write", "shell:exec"]),
  backgroundAllowed: z.boolean().default(false),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});
export type PermissionProfile = z.infer<typeof PermissionProfileSchema>;
