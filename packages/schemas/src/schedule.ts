import { z } from "zod";
import { SchedulePreset } from "./enums.js";

export const ScheduleSchema = z.object({
  id: z.string().uuid(),
  agentId: z.string().uuid(),
  enabled: z.boolean().default(false),
  preset: SchedulePreset.default("manual_only"),
  plainEnglish: z.string().max(200).default("Manual only"),
  backendExpression: z.string().nullable().default(null),
  nextRunAt: z.string().datetime().nullable().default(null),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});
export type Schedule = z.infer<typeof ScheduleSchema>;
