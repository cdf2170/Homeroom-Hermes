import { z } from "zod";
import { RunStatus, RunTrigger } from "@homeroom/domain";

export const RunView = z.object({
  id: z.string().uuid(),
  agentId: z.string().uuid(),
  trigger: RunTrigger,
  status: RunStatus,
  startedAt: z.string().datetime(),
  finishedAt: z.string().datetime().nullable(),
  inputSummary: z.string(),
  outputSummary: z.string(),
  errorSummary: z.string().nullable(),
});

export type RunView = z.infer<typeof RunView>;
