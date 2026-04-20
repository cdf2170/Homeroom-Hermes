import { useSyncExternalStore } from 'react';
import { Agent } from '@/types/agent';
import { AgentSummaryView } from '@/types/views';
// ── Simple external store for agents shared across components ─────────────────
let agents: Agent[] = [];
let backendConnected = false;
let listeners: Set<() => void> = new Set();

function emitChange() {
  listeners.forEach(l => l());
}

export function getAgents() {
  return agents;
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

// Fields that the backend UpdateAgentRequest accepts.
const BACKEND_FIELDS = new Set([
  'name', 'purpose', 'role', 'instructions',
  'enabled', 'backgroundEnabled', 'runtimeMode', 'smartnessLevel',
  'sceneRoomId', 'appearance',
  'audienceNotes', 'environmentNotes', 'memoryNotes',
  'checkInFrequency', 'escalationBehavior', 'taskStyle',
  'notifyOnComplete', 'notifyOnError',
]);

// Map frontend field names to backend field names where they differ.
const FIELD_MAP: Record<string, string> = {
  personality: 'instructions',   // personality textarea → backend instructions field
  zone: 'sceneRoomId',           // frontend zone → backend sceneRoomId via ZONE_MAP
};

const ZONE_TO_ROOM: Record<string, string> = {
  work: 'focus_room', lounge: 'lounge', meeting: 'meeting',
  kitchen: 'kitchen', server: 'server', quiet: 'quiet',
};

function toBackendUpdates(updates: Partial<Agent>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(updates)) {
    const backendKey = FIELD_MAP[k] ?? k;
    if (!BACKEND_FIELDS.has(backendKey)) continue;
    if (backendKey === 'sceneRoomId' && typeof v === 'string') {
      out[backendKey] = ZONE_TO_ROOM[v] ?? v;
    } else if (backendKey === 'appearance' && typeof v === 'object') {
      out[backendKey] = JSON.stringify(v);
    } else {
      out[backendKey] = v;
    }
  }
  return out;
}

export function addAgent(agent: Agent) {
  agents = [...agents, agent];
  emitChange();
}

export function updateAgent(id: string, updates: Partial<Agent>) {
  // Immediate optimistic update for responsive UI
  agents = agents.map(a => a.id === id ? { ...a, ...updates } : a);
  emitChange();

  // Async persist to backend — fire-and-forget, non-blocking
  if (backendConnected) {
    const backendUpdates = toBackendUpdates(updates);
    if (Object.keys(backendUpdates).length > 0) {
      import('@/services/backendApi').then(({ backendApi }) => {
        backendApi.updateAgent(id, backendUpdates).catch(err =>
          console.warn('[agentStore] Failed to persist update:', err),
        );
      });
    }
  }
}

export function removeAgent(id: string) {
  agents = agents.filter(a => a.id !== id);
  emitChange();

  if (backendConnected) {
    import('@/services/backendApi').then(({ backendApi }) => {
      backendApi.deleteAgent(id).catch(err =>
        console.warn('[agentStore] Failed to delete agent:', err),
      );
    });
  }
}

export function useAgents(): Agent[] {
  return useSyncExternalStore(subscribe, getAgents);
}

/**
 * Called by useBackendSync / useAgents query when the real backend is available.
 * Replaces mock agents with live data from the service.
 */
export function setAgentsFromBackend(backendAgents: AgentSummaryView[]) {
  backendConnected = true;
  agents = backendAgents.map(a => ({
    id:                 a.id,
    name:               a.name,
    role:               a.role,
    purpose:            a.purpose,
    archetype:          'helper' as const,
    vibe:               'calm' as const,
    personality:        '',
    instructions:       '',
    state:              a.state,
    zone:               a.zone,
    defaultRoom:        a.zone,
    enabled:            a.enabled,
    backgroundEnabled:  a.backgroundEnabled,
    runtimeMode:        a.runtimeMode,
    smartnessLevel:     a.smartnessLevel,
    safetyLevel:        'strict' as const,
    currentTask:        a.currentTask,
    lastRunAt:          a.lastRunAt,
    lastRunStatus:      a.lastRunStatus,
    scheduleSummary:    a.scheduleSummary,
    outfitColor:        a.outfitColor,
    initial:            a.initial,
    runCount:           a.runCount,
    needsAttention:     a.needsAttention,
    hasPermissions:     a.hasPermissions,
    appearance:         { bodyType: 'masculine', skinTone: '#F5CBA7', hairStyle: 'short', hairColor: '#4A4A4A', outfitStyle: 'casual', outfitColor: a.outfitColor } as any,
    permissionProfileId: null,
    checkInFrequency:   'on_completion' as const,
    escalationBehavior: 'ask' as const,
    taskStyle:          'methodical' as const,
    notifyOnComplete:   true,
    notifyOnError:      true,
    audienceNotes:      '',
    environmentNotes:   '',
    memoryNotes:        '',
    memoryItems:        [],
    ruleItems:          [],
    activities:         [],
    runs:               [],
    permissions:        null,
    schedule:           null,
  })) as unknown as Agent[];
  emitChange();
}
