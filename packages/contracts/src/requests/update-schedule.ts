import { z } from "zod";
import { SchedulePreset } from "@homeroom/domain";

export const UpdateScheduleRequest = z.object({
  enabled: z.boolean().default(false),
  preset: SchedulePreset.default("manual_only"),
  customCronExpression: z.string().nullable().default(null),
  timezone: z.string().default("UTC"),
});

export type UpdateScheduleRequest = z.infer<typeof UpdateScheduleRequest>;
