import { z } from "zod";
import { AgentSchema, RuntimeMode } from "@homeroom/schemas";

// Extended agent profile — the service's internal model of an agent.
// Includes all base Agent fields plus richer profile content managed by Homeroom.
export const AgentProfileSchema = AgentSchema.extend({
  // Identity / role
  role: z.string().max(200).default(""),
  instructions: z.string().max(4000).default(""),
  audienceNotes: z.string().max(1000).default(""),
  environmentNotes: z.string().max(1000).default(""),
  memoryNotes: z.string().max(2000).default(""),

  // Behavior preferences
  checkInFrequency: z
    .enum(["never", "on_completion", "hourly", "always"])
    .default("on_completion"),
  escalationBehavior: z.enum(["stop", "ask", "continue"]).default("ask"),
  taskStyle: z.enum(["methodical", "exploratory", "minimal"]).default("methodical"),
  notifyOnComplete: z.boolean().default(true),
  notifyOnError: z.boolean().default(true),

  // Runtime preference (UI-level concept → used in trust checks)
  runtimePreference: RuntimeMode.optional(),

  // Specific model to use for runs (e.g. "anthropic/claude-3.5-sonnet")
  modelRef: z.string().nullable().optional(),
});

export type AgentProfile = z.infer<typeof AgentProfileSchema>;
