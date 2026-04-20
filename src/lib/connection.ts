/**
 * connection.ts
 *
 * Tracks whether the Homeroom backend service is reachable.
 * Works exactly like agentStore — a tiny external store that any
 * component can subscribe to with useSyncExternalStore.
 *
 * States:
 *   'checking'    — initial probe in progress
 *   'connected'   — backend replied OK
 *   'disconnected'— backend unreachable
 */

import { useSyncExternalStore } from 'react';
import { backendApi } from '@/services/backendApi';

export type ConnectionStatus = 'checking' | 'connected' | 'disconnected';

let status: ConnectionStatus = 'checking';
let listeners: Set<() => void> = new Set();

function emit() {
  listeners.forEach(l => l());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function getConnectionStatus(): ConnectionStatus {
  return status;
}

export function setConnectionStatus(s: ConnectionStatus) {
  if (status === s) return;
  status = s;
  emit();
}

export function useConnectionStatus(): ConnectionStatus {
  return useSyncExternalStore(subscribe, getConnectionStatus);
}

/** Run once on app boot. Probes the backend and updates status. */
export async function probeBackend(): Promise<boolean> {
  const reachable = await backendApi.ping();
  setConnectionStatus(reachable ? 'connected' : 'disconnected');
  return reachable;
}
