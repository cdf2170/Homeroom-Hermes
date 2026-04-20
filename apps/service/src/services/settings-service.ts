/**
 * settings-service.ts
 *
 * The settings service now reads provider connection state from the encrypted
 * credential store (the same store the adapter reads at dispatch time). This
 * guarantees that "connected" in /api/settings always means "Hermes has a
 * usable key for this provider" -- the two views can't drift.
 *
 * The old `providerKey` update path has been removed. Credentials are only
 * writable via /api/credentials/:provider, which goes to the encrypted store.
 */

import type { SettingsRepo } from "../repos/settings-repo.js";
import type { UpdateSettingsRequest } from "@homeroom/contracts";
import type { SettingsView } from "@homeroom/contracts";
import { listCredentials } from "../lib/credentials.js";

const KNOWN_PROVIDERS = [
  { id: "anthropic", label: "Anthropic (Claude)" },
  { id: "openai", label: "OpenAI" },
  { id: "groq", label: "Groq" },
  { id: "local", label: "Local (Ollama)" },
];

export function createSettingsService(settingsRepo: SettingsRepo) {
  return {
    async get(): Promise<SettingsView> {
      const row = settingsRepo.get();

      // Read from the encrypted credential store -- the same source the
      // hermes adapter uses at runtime. A provider is reported "connected"
      // iff there is actually a key Hermes can use.
      const stored = await listCredentials();
      const storedByLowerId = new Map<string, typeof stored[number]>();
      for (const c of stored) {
        storedByLowerId.set(c.provider.toLowerCase(), c);
      }

      return {
        defaultRuntimeMode: row.defaultRuntimeMode as SettingsView["defaultRuntimeMode"],
        defaultSmartLevel: row.defaultSmartLevel as SettingsView["defaultSmartLevel"],
        defaultSafetyLevel: row.defaultSafetyLevel as SettingsView["defaultSafetyLevel"],
        defaultWorkspacePath: row.defaultWorkspacePath,
        // Back-compat: mirror into the legacy name too
        openclawWorkspacePath: row.defaultWorkspacePath,
        providers: KNOWN_PROVIDERS.map((p) => {
          const cred = storedByLowerId.get(p.id.toLowerCase());
          return {
            id: p.id,
            label: p.label,
            connected: !!cred,
            maskedKey: cred?.masked ?? null,
            lastVerifiedAt: cred?.updatedAt ?? null,
          };
        }),
        updatedAt: row.updatedAt,
      };
    },

    async update(req: UpdateSettingsRequest): Promise<SettingsView> {
      const patch: Parameters<SettingsRepo["update"]>[0] = {};

      if (req.defaultRuntimeMode) patch.defaultRuntimeMode = req.defaultRuntimeMode;
      if (req.defaultSmartLevel) patch.defaultSmartLevel = req.defaultSmartLevel;
      if (req.defaultSafetyLevel) patch.defaultSafetyLevel = req.defaultSafetyLevel;
      // Accept either the new or the legacy field name
      const workspacePath = req.defaultWorkspacePath ?? req.openclawWorkspacePath;
      if (workspacePath !== undefined) patch.defaultWorkspacePath = workspacePath;

      // req.providerKey is intentionally ignored. Provider credentials are
      // managed only through POST /api/credentials/:provider so the encrypted
      // store is the single source of truth.
      if (req.providerKey) {
        console.warn(
          "[settings] providerKey in PATCH /api/settings is ignored. " +
          "Use POST /api/credentials/:provider to save credentials.",
        );
      }

      settingsRepo.update(patch);
      return this.get();
    },
  };
}

export type SettingsService = ReturnType<typeof createSettingsService>;
