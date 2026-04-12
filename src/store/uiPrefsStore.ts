/**
 * uiPrefsStore — localStorage-backed UI preferences.
 *
 * These are settings that live entirely in the frontend (animations, notification
 * toggles, approval defaults). The backend settings endpoint only tracks runtime
 * config (defaultRuntimeMode, etc.) — these never go to the server.
 */

import { useSyncExternalStore } from 'react';

export interface UiPrefs {
  requireApprovalByDefault: boolean;
  backgroundOffByDefault: boolean;
  ambientAnimations: boolean;
  agentIdleAnimations: boolean;
  notifyOnAttention: boolean;
  notifyOnComplete: boolean;
}

const STORAGE_KEY = 'homeroom-ui-prefs';

const DEFAULTS: UiPrefs = {
  requireApprovalByDefault: true,
  backgroundOffByDefault: true,
  ambientAnimations: true,
  agentIdleAnimations: true,
  notifyOnAttention: true,
  notifyOnComplete: true,
};

function load(): UiPrefs {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? { ...DEFAULTS, ...JSON.parse(raw) } : { ...DEFAULTS };
  } catch {
    return { ...DEFAULTS };
  }
}

let prefs: UiPrefs = load();
const listeners = new Set<() => void>();

function emit() {
  listeners.forEach(l => l());
}

export function getUiPrefs(): UiPrefs {
  return prefs;
}

export function setUiPref<K extends keyof UiPrefs>(key: K, value: UiPrefs[K]) {
  prefs = { ...prefs, [key]: value };
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs)); } catch { /* storage full */ }
  emit();
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function useUiPrefs(): UiPrefs {
  return useSyncExternalStore(subscribe, getUiPrefs);
}
