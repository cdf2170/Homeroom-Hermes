import type { SettingsRepo } from "../repos/settings-repo.js";
import type { UpdateSettingsRequest } from "@homeroom/contracts";
import type { SettingsView } from "@homeroom/contracts";

const KNOWN_PROVIDERS = [
  { id: "anthropic", label: "Anthropic (Claude)" },
  { id: "openai", label: "OpenAI" },
  { id: "groq", label: "Groq" },
  { id: "local", label: "Local (Ollama)" },
];

function maskKey(key: string): string {
  if (key.length <= 8) return "••••••••";
  return key.slice(0, 4) + "••••" + key.slice(-4);
}

export function createSettingsService(settingsRepo: SettingsRepo) {
  return {
    get(): SettingsView {
      const row = settingsRepo.get();
      return {
        defaultRuntimeMode: row.defaultRuntimeMode as SettingsView["defaultRuntimeMode"],
        defaultSmartLevel: row.defaultSmartLevel as SettingsView["defaultSmartLevel"],
        defaultSafetyLevel: row.defaultSafetyLevel as SettingsView["defaultSafetyLevel"],
        openclawWorkspacePath: row.openclawWorkspacePath,
        providers: KNOWN_PROVIDERS.map((p) => {
          const meta = row.providerMeta[p.id];
          return {
            id: p.id,
            label: p.label,
            connected: !!meta?.maskedKey,
            maskedKey: meta?.maskedKey ?? null,
            lastVerifiedAt: meta?.lastVerifiedAt ?? null,
          };
        }),
        updatedAt: row.updatedAt,
      };
    },

    update(req: UpdateSettingsRequest): SettingsView {
      const current = settingsRepo.get();
      const patch: Parameters<SettingsRepo["update"]>[0] = {};

      if (req.defaultRuntimeMode) patch.defaultRuntimeMode = req.defaultRuntimeMode;
      if (req.defaultSmartLevel) patch.defaultSmartLevel = req.defaultSmartLevel;
      if (req.defaultSafetyLevel) patch.defaultSafetyLevel = req.defaultSafetyLevel;
      if (req.openclawWorkspacePath !== undefined)
        patch.openclawWorkspacePath = req.openclawWorkspacePath;

      if (req.providerKey) {
        const { providerId, key } = req.providerKey;
        // Store only masked preview — TODO(phase-5): store real key in keychain
        const providerMeta = { ...current.providerMeta };
        providerMeta[providerId] = {
          maskedKey: maskKey(key),
          lastVerifiedAt: new Date().toISOString(),
        };
        patch.providerMeta = providerMeta;
      }

      settingsRepo.update(patch);
      return this.get();
    },
  };
}

export type SettingsService = ReturnType<typeof createSettingsService>;
