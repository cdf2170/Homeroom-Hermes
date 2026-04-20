import { z } from "zod";

export const UpdateSettingsRequest = z
  .object({
    defaultRuntimeMode: z.enum(["local", "cloud", "hybrid"]),
    defaultSmartLevel: z.enum(["basic", "standard", "advanced"]),
    defaultSafetyLevel: z.enum(["strict", "standard", "permissive"]),
    defaultWorkspacePath: z.string(),
    /** @deprecated Use defaultWorkspacePath. Accepted as an alias. */
    openclawWorkspacePath: z.string(),
    /**
     * @deprecated No-op at the API boundary. Credentials are writable only
     * via POST /api/credentials/:provider to the encrypted store.
     * Accepting this key here for back-compat with older clients; the
     * settings service logs a warning and ignores it.
     */
    providerKey: z.object({
      providerId: z.string(),
      key: z.string().min(1),
    }),
  })
  .partial();

export type UpdateSettingsRequest = z.infer<typeof UpdateSettingsRequest>;
