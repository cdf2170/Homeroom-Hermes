import { z } from "zod";
import { AgentSummaryView } from "./agent-summary-view.js";
import { MemoryItemSchema, RuleItemSchema, RuntimeProjectionSchema } from "@homeroom/domain";
import { PermissionProfileSchema, ScheduleSchema } from "@homeroom/domain";
import { TrustFindingSchema } from "@homeroom/domain";

export const AgentDetailView = AgentSummaryView.extend({
  // Full profile fields
  role: z.string(),
  instructions: z.string(),
  audienceNotes: z.string(),
  environmentNotes: z.string(),
  memoryNotes: z.string(),
  checkInFrequency: z.enum(["never", "on_completion", "hourly", "always"]),
  escalationBehavior: z.enum(["stop", "ask", "continue"]),
  taskStyle: z.enum(["methodical", "exploratory", "minimal"]),
  notifyOnComplete: z.boolean(),
  notifyOnError: z.boolean(),

  // Nested
  memoryItems: z.array(MemoryItemSchema),
  ruleItems: z.array(RuleItemSchema),
  permissionProfile: PermissionProfileSchema.nullable(),
  schedule: ScheduleSchema.nullable(),
  runtime: RuntimeProjectionSchema.nullable(),
  trustFindings: z.array(TrustFindingSchema),

  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export type AgentDetailView = z.infer<typeof AgentDetailView>;
