import { useSyncExternalStore } from 'react';
import { Agent } from '@/types/agent';
import { AgentSummaryView } from '@/types/views';
import { mockAgents } from '@/data/mockAgents';

// Simple external store for agents shared across components
let agents: Agent[] = [...mockAgents];
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

export function addAgent(agent: Agent) {
  agents = [...agents, agent];
  emitChange();
}

export function updateAgent(id: string, updates: Partial<Agent>) {
  agents = agents.map(a => a.id === id ? { ...a, ...updates } : a);
  emitChange();
}

export function removeAgent(id: string) {
  agents = agents.filter(a => a.id !== id);
  emitChange();
}

export function useAgents(): Agent[] {
  return useSyncExternalStore(subscribe, getAgents);
}

/**
 * Called by useBackendSync when the real backend is available.
 * Replaces mock agents with live data from the service.
 * AgentSummaryView is compatible with Agent for display purposes.
 */
export function setAgentsFromBackend(backendAgents: AgentSummaryView[]) {
  // Merge backend agents into the Agent shape the store expects.
  // Fields not returned by the summary endpoint get sensible defaults.
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
    appearance:         { bodyType: 'androgynous', skinTone: '#F5CBA7', hairStyle: 'short', hairColor: '#4A4A4A', outfitStyle: 'casual', outfitColor: a.outfitColor } as any,
    permissionProfileId: null,
    checkInFrequency:   'daily' as const,
    escalationBehavior: 'notify' as const,
    taskStyle:          'balanced' as const,
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
