import { z } from "zod";
import { RunTrigger, RunStatus } from "./enums.js";

export const RunRecordSchema = z.object({
  id: z.string().uuid(),
  agentId: z.string().uuid(),
  trigger: RunTrigger,
  status: RunStatus.default("pending"),
  startedAt: z.string().datetime(),
  finishedAt: z.string().datetime().nullable().default(null),
  inputSummary: z.string().max(1000).default(""),
  outputSummary: z.string().max(2000).default(""),
  errorSummary: z.string().max(2000).nullable().default(null),
  backendRef: z.string().nullable().default(null),
});
export type RunRecord = z.infer<typeof RunRecordSchema>;
