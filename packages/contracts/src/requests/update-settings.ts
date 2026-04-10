import { z } from "zod";

export const UpdateSettingsRequest = z
  .object({
    defaultRuntimeMode: z.enum(["local", "cloud", "hybrid"]),
    defaultSmartLevel: z.enum(["basic", "standard", "advanced"]),
    defaultSafetyLevel: z.enum(["strict", "standard", "permissive"]),
    openclawWorkspacePath: z.string(),
    // Providers: only sends key on first connection; omit to keep existing
    providerKey: z.object({
      providerId: z.string(),
      key: z.string().min(1),
    }),
  })
  .partial();

export type UpdateSettingsRequest = z.infer<typeof UpdateSettingsRequest>;
