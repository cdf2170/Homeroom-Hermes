import { z } from "zod";

export const TrustLevel = z.enum(["ok", "info", "warning", "critical"]);
export type TrustLevel = z.infer<typeof TrustLevel>;

export const TrustScope = z.enum(["agent", "runtime", "global"]);
export type TrustScope = z.infer<typeof TrustScope>;

export const TrustFindingSchema = z.object({
  id: z.string().uuid(),
  scope: TrustScope,
  targetId: z.string().uuid().nullable().default(null),
  level: TrustLevel,
  code: z.string(), // e.g. "BACKGROUND_NO_GATE"
  title: z.string().max(120),
  detail: z.string().max(500),
  recommendedAction: z.string().max(300).default(""),
  createdAt: z.string().datetime(),
});

export type TrustFinding = z.infer<typeof TrustFindingSchema>;
