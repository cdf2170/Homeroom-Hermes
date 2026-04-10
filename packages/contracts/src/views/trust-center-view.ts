import { z } from "zod";
import { TrustFindingSchema, TrustLevel } from "@homeroom/domain";

export const TrustCenterView = z.object({
  overallPosture: TrustLevel,
  summary: z.string(),
  criticalCount: z.number().int(),
  warningCount: z.number().int(),
  infoCount: z.number().int(),
  findings: z.array(TrustFindingSchema),
  checkedAt: z.string().datetime(),
});

export type TrustCenterView = z.infer<typeof TrustCenterView>;
