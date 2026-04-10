import { z } from "zod";

export const RuntimeHealthSchema = z.object({
  openclawInstalled: z.boolean(),
  gatewayReachable: z.boolean(),
  schedulerReachable: z.boolean(),
  modelsAvailable: z.array(z.string()),
  homeroomServiceMode: z.enum(["local", "cloud", "hybrid"]),
  warnings: z.array(z.string()),
  checkedAt: z.string().datetime(),
});
export type RuntimeHealth = z.infer<typeof RuntimeHealthSchema>;
