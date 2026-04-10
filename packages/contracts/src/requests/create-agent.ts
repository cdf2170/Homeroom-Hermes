import { z } from "zod";
import { Archetype, Vibe, SmartLevel, RuntimeMode } from "@homeroom/domain";

export const CreateAgentRequest = z.object({
  name: z.string().min(1).max(64),
  purpose: z.string().max(500).default(""),
  archetype: Archetype.default("helper"),
  vibe: Vibe.default("calm"),
  smartnessLevel: SmartLevel.default("standard"),
  runtimeMode: RuntimeMode.default("local"),
});

export type CreateAgentRequest = z.infer<typeof CreateAgentRequest>;
