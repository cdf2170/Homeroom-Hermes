import { z } from "zod";
import { Archetype, Vibe, SmartLevel, RuntimeMode, RoomId } from "@homeroom/domain";

export const UpdateAgentRequest = z
  .object({
    name: z.string().min(1).max(64),
    purpose: z.string().max(500),
    archetype: Archetype,
    vibe: Vibe,
    smartnessLevel: SmartLevel,
    runtimeMode: RuntimeMode,
    enabled: z.boolean(),
    backgroundEnabled: z.boolean(),
    sceneRoomId: RoomId,

    // Profile fields
    role: z.string().max(200),
    instructions: z.string().max(4000),
    audienceNotes: z.string().max(1000),
    environmentNotes: z.string().max(1000),
    memoryNotes: z.string().max(2000),
    checkInFrequency: z.enum(["never", "on_completion", "hourly", "always"]),
    escalationBehavior: z.enum(["stop", "ask", "continue"]),
    taskStyle: z.enum(["methodical", "exploratory", "minimal"]),
    notifyOnComplete: z.boolean(),
    notifyOnError: z.boolean(),

    // Model selection (e.g. "anthropic/claude-3.5-sonnet")
    modelRef: z.string().nullable(),
  })
  .partial();

export type UpdateAgentRequest = z.infer<typeof UpdateAgentRequest>;
