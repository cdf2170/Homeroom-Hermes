import { z } from "zod";

export const RunAgentRequest = z.object({
  input: z.string().max(4000).default(""),
});

export type RunAgentRequest = z.infer<typeof RunAgentRequest>;
