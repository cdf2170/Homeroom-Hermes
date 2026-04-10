import { z } from "zod";
import {
  AgentStatus,
  Archetype,
  Vibe,
  SmartLevel,
  RuntimeMode,
  RoomId,
  RunStatus,
} from "./enums.js";

export const AgentSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).max(64),
  purpose: z.string().max(500).default(""),
  archetype: Archetype.default("helper"),
  vibe: Vibe.default("calm"),
  smartnessLevel: SmartLevel.default("standard"),
  runtimeMode: RuntimeMode.default("local"),
  enabled: z.boolean().default(false),
  backgroundEnabled: z.boolean().default(false),
  status: AgentStatus.default("offline"),
  sceneRoomId: RoomId.default("focus_room"),
  sceneState: z.string().default("idle"),
  lastRunAt: z.string().datetime().nullable().default(null),
  lastRunStatus: RunStatus.nullable().default(null),
  permissionProfileId: z.string().uuid().nullable().default(null),
  appearanceId: z.string().uuid().nullable().default(null),
  scheduleSummary: z.string().nullable().default(null),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});
export type Agent = z.infer<typeof AgentSchema>;

export const CreateAgentInput = AgentSchema.pick({
  name: true,
  purpose: true,
  archetype: true,
  vibe: true,
  smartnessLevel: true,
  runtimeMode: true,
});
export type CreateAgentInput = z.infer<typeof CreateAgentInput>;

export const UpdateAgentInput = CreateAgentInput.partial().extend({
  enabled: z.boolean().optional(),
  backgroundEnabled: z.boolean().optional(),
  sceneRoomId: RoomId.optional(),
});
export type UpdateAgentInput = z.infer<typeof UpdateAgentInput>;
