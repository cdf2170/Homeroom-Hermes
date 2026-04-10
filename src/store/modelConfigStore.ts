import { useSyncExternalStore } from 'react';
import { ModelConfig, DEFAULT_MODEL_CONFIG } from '@/types/modelConfig';

const STORAGE_KEY = 'homeroom-model-config';
const FAVORITES_KEY = 'homeroom-favorite-models';
const CUSTOM_MODELS_KEY = 'homeroom-custom-models';
const AGENT_MODELS_KEY = 'homeroom-agent-models';
const PROVIDER_KEYS_KEY = 'homeroom-provider-keys';

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

function loadProviderKeys(): Record<string, string> {
  try {
    const stored = localStorage.getItem(PROVIDER_KEYS_KEY);
    if (stored) return JSON.parse(stored);
  } catch {}
  return {};
}

let config: ModelConfig = loadConfig();
let favorites: string[] = loadFavorites();
let customModels: { id: string; name: string; provider: string }[] = loadCustomModels();
let agentModels: Record<string, string> = loadAgentModels();
let providerKeys: Record<string, string> = loadProviderKeys();
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

// Provider API keys
export function getProviderKeys() { return providerKeys; }

export function getProviderKey(provider: string): string | null {
  return providerKeys[provider] || null;
}

export function hasProviderKey(provider: string): boolean {
  return !!providerKeys[provider]?.trim();
}

export function setProviderKey(provider: string, key: string) {
  providerKeys = { ...providerKeys, [provider]: key };
  localStorage.setItem(PROVIDER_KEYS_KEY, JSON.stringify(providerKeys));
  emit();
}

export function removeProviderKey(provider: string) {
  const { [provider]: _, ...rest } = providerKeys;
  providerKeys = rest;
  localStorage.setItem(PROVIDER_KEYS_KEY, JSON.stringify(providerKeys));
  emit();
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function getSnapshot() {
  return { config, favorites, customModels, agentModels, providerKeys };
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
      next.providerKeys !== lastSnapshot.providerKeys
    ) {
      lastSnapshot = next;
    }
    return lastSnapshot;
  });
}
