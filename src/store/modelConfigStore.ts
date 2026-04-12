import { useSyncExternalStore } from 'react';
import { ModelConfig, DEFAULT_MODEL_CONFIG } from '@/types/modelConfig';

const STORAGE_KEY = 'homeroom-model-config';
const FAVORITES_KEY = 'homeroom-favorite-models';
const CUSTOM_MODELS_KEY = 'homeroom-custom-models';
const AGENT_MODELS_KEY = 'homeroom-agent-models';

/**
 * SECURITY: Provider keys are NEVER stored in the browser.
 * Keys go directly to the backend's encrypted credential store.
 * We only track which providers the user has connected (boolean flags).
 */
const PROVIDER_CONNECTED_KEY = 'homeroom-provider-connected';

// On load, wipe any legacy plaintext keys that the old code stored
try {
  const legacy = localStorage.getItem('homeroom-provider-keys');
  if (legacy) {
    localStorage.removeItem('homeroom-provider-keys');
  }
} catch {}

function loadConfig(): ModelConfig {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) return { ...DEFAULT_MODEL_CONFIG, ...JSON.parse(stored) };
  } catch {}
  return { ...DEFAULT_MODEL_CONFIG };
}

function loadFavorites(): string[] {
  try {
    const stored = localStorage.getItem(FAVORITES_KEY);
    if (stored) return JSON.parse(stored);
  } catch {}
  return ['openai/gpt-4o', 'anthropic/claude-3.5-sonnet', 'google/gemini-2.5-pro'];
}

function loadCustomModels(): { id: string; name: string; provider: string }[] {
  try {
    const stored = localStorage.getItem(CUSTOM_MODELS_KEY);
    if (stored) return JSON.parse(stored);
  } catch {}
  return [];
}

function loadAgentModels(): Record<string, string> {
  try {
    const stored = localStorage.getItem(AGENT_MODELS_KEY);
    if (stored) return JSON.parse(stored);
  } catch {}
  return {};
}

function loadProviderConnected(): Record<string, boolean> {
  try {
    const stored = localStorage.getItem(PROVIDER_CONNECTED_KEY);
    if (stored) return JSON.parse(stored);
  } catch {}
  return {};
}

let config: ModelConfig = loadConfig();
let favorites: string[] = loadFavorites();
let customModels: { id: string; name: string; provider: string }[] = loadCustomModels();
let agentModels: Record<string, string> = loadAgentModels();
let providerConnected: Record<string, boolean> = loadProviderConnected();
let listeners: Set<() => void> = new Set();

function emit() {
  listeners.forEach(l => l());
}

function save() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
}

export function getModelConfig() {
  return config;
}

export function updateModelConfig(updates: Partial<ModelConfig>) {
  config = { ...config, ...updates };
  save();
  emit();
}

export function resetModelConfig() {
  config = { ...DEFAULT_MODEL_CONFIG };
  save();
  emit();
}

export function isModelConfigured(): boolean {
  return config.apiKey.length > 0 || config.setupPath === 'unsure' || config.setupPath === 'local';
}

// Favorites
export function getFavorites() { return favorites; }

export function toggleFavorite(modelId: string) {
  if (favorites.includes(modelId)) {
    favorites = favorites.filter(f => f !== modelId);
  } else {
    favorites = [...favorites, modelId];
  }
  localStorage.setItem(FAVORITES_KEY, JSON.stringify(favorites));
  emit();
}

export function isFavorite(modelId: string) {
  return favorites.includes(modelId);
}

// Per-agent model assignment
export function getAgentModels() { return agentModels; }

export function getAgentModel(agentId: string): string | null {
  return agentModels[agentId] || null;
}

export function setAgentModel(agentId: string, modelId: string) {
  agentModels = { ...agentModels, [agentId]: modelId };
  localStorage.setItem(AGENT_MODELS_KEY, JSON.stringify(agentModels));
  emit();
}

// Custom models
export function getCustomModels() { return customModels; }

export function addCustomModel(name: string, provider: string) {
  const id = `custom/${name.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}`;
  customModels = [...customModels, { id, name, provider }];
  localStorage.setItem(CUSTOM_MODELS_KEY, JSON.stringify(customModels));
  emit();
  return id;
}

export function removeCustomModel(id: string) {
  customModels = customModels.filter(m => m.id !== id);
  localStorage.setItem(CUSTOM_MODELS_KEY, JSON.stringify(customModels));
  emit();
}

// Provider connection status (boolean flags only -- keys are backend-only)

/** @deprecated Use useCredentials() hook for authoritative status. This is a UI cache. */
export function getProviderKeys() { return providerConnected; }

/**
 * Raw keys are never stored in the browser. Always returns null.
 * Use the backend credential endpoints to manage keys.
 */
export function getProviderKey(_provider: string): string | null {
  return null;
}

/** Check if a provider has been connected (UI cache). Prefer useCredentials() for truth. */
export function hasProviderKey(provider: string): boolean {
  return !!providerConnected[provider];
}

/**
 * Mark a provider as connected in the UI cache. Does NOT store the key.
 * The actual key must be sent to the backend via useSaveCredential().
 */
export function setProviderKey(provider: string, _key: string) {
  providerConnected = { ...providerConnected, [provider]: true };
  localStorage.setItem(PROVIDER_CONNECTED_KEY, JSON.stringify(providerConnected));
  emit();
}

/** Mark a provider as disconnected in the UI cache. */
export function removeProviderKey(provider: string) {
  const { [provider]: _, ...rest } = providerConnected;
  providerConnected = rest;
  localStorage.setItem(PROVIDER_CONNECTED_KEY, JSON.stringify(providerConnected));
  emit();
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function getSnapshot() {
  return { config, favorites, customModels, agentModels, providerConnected };
}

let lastSnapshot = getSnapshot();

export function useModelConfig(): ModelConfig {
  return useSyncExternalStore(subscribe, getModelConfig);
}

export function useModelStore() {
  return useSyncExternalStore(subscribe, () => {
    const next = getSnapshot();
    if (
      next.config !== lastSnapshot.config ||
      next.favorites !== lastSnapshot.favorites ||
      next.customModels !== lastSnapshot.customModels ||
      next.agentModels !== lastSnapshot.agentModels ||
      next.providerConnected !== lastSnapshot.providerConnected
    ) {
      lastSnapshot = next;
    }
    return lastSnapshot;
  });
}
