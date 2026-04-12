import { z } from "zod";
import {
  AgentStatus,
  Archetype,
  Vibe,
  RuntimeMode,
  SmartLevel,
  RoomId,
  RunStatus,
  TrustLevel,
} from "@homeroom/domain";

export const AgentSummaryView = z.object({
  id: z.string().uuid(),
  name: z.string(),
  purpose: z.string(),
  archetype: Archetype,
  vibe: Vibe,
  status: AgentStatus,
  enabled: z.boolean(),
  backgroundEnabled: z.boolean(),
  runtimeMode: RuntimeMode,
  smartnessLevel: SmartLevel,
  sceneRoomId: RoomId,
  lastRunAt: z.string().datetime().nullable(),
  lastRunStatus: RunStatus.nullable(),
  scheduleSummary: z.string().nullable(),
  trustPosture: TrustLevel,
  modelRef: z.string().nullable().optional(),
});

export type AgentSummaryView = z.infer<typeof AgentSummaryView>;
