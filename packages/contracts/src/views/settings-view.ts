import { z } from "zod";

export const SettingsView = z.object({
  defaultRuntimeMode: z.enum(["local", "cloud", "hybrid"]),
  defaultSmartLevel: z.enum(["basic", "standard", "advanced"]),
  defaultSafetyLevel: z.enum(["strict", "standard", "permissive"]),
  defaultWorkspacePath: z.string().default(""),
  /** @deprecated Kept for back-compat; mirrors defaultWorkspacePath. */
  openclawWorkspacePath: z.string().default(""),
  // Secret keys — service never returns full value; UI shows only masked preview
  providers: z.array(
    z.object({
      id: z.string(),
      label: z.string(),
      connected: z.boolean(),
      maskedKey: z.string().nullable(),
      lastVerifiedAt: z.string().datetime().nullable(),
    }),
  ),
  updatedAt: z.string().datetime(),
});

export type SettingsView = z.infer<typeof SettingsView>;
