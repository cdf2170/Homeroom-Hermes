import { z } from "zod";
import { TrustLevel, RuntimeHealthSchema } from "@homeroom/domain";

export const FrontdeskAgentSummary = z.object({
  id: z.string().uuid(),
  name: z.string(),
  status: z.string(),
  trustPosture: TrustLevel,
  hasActiveSchedule: z.boolean(),
  lastRunAt: z.string().datetime().nullable(),
});

export const FrontdeskView = z.object({
  overallPosture: TrustLevel,
  postureSummary: z.string(),
  agentCount: z.number().int(),
  enabledAgentCount: z.number().int(),
  agentsNeedingAttention: z.array(FrontdeskAgentSummary),
  onboardingGaps: z.array(z.string()),
  runtime: RuntimeHealthSchema,
});

export type FrontdeskView = z.infer<typeof FrontdeskView>;
