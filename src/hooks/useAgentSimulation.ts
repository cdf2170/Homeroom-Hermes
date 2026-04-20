import { useEffect, useRef, useCallback } from 'react';
import { useSyncExternalStore } from 'react';
import { getAgents } from '@/store/agentStore';
import type { AgentState, OfficeZone } from '@/types/agent';

/**
 * Visual-only agent simulation for the Office page.
 *
 * Creates a living office feel by randomly transitioning agent visual states
 * (working → break → idle, etc.) WITHOUT mutating real agent state in the
 * store or persisting to the backend.
 *
 * Returns a map of visual overrides that the Office page merges on top of
 * real agent data before rendering.
 */

const TICK_MS = 4000;

const transitions: Record<AgentState, { next: AgentState; zone: OfficeZone; chance: number }[]> = {
  working: [
    { next: 'on-break', zone: 'lounge', chance: 0.04 },
    { next: 'idle', zone: 'work', chance: 0.06 },
  ],
  idle: [
    { next: 'working', zone: 'work', chance: 0.15 },
    { next: 'on-break', zone: 'lounge', chance: 0.05 },
  ],
  'on-break': [
    { next: 'working', zone: 'work', chance: 0.1 },
    { next: 'idle', zone: 'work', chance: 0.05 },
  ],
  waiting: [
    { next: 'working', zone: 'work', chance: 0.03 },
  ],
  'needs-attention': [],
  paused: [
    { next: 'idle', zone: 'work', chance: 0.05 },
  ],
  walking: [
    { next: 'working', zone: 'work', chance: 0.3 },
  ],
  sleeping: [],
  offline: [],
};

// ── Visual override store (separate from agent store) ──

export interface VisualOverride {
  state: AgentState;
  zone: OfficeZone;
}

let overrides = new Map<string, VisualOverride>();
let listeners = new Set<() => void>();
let snapshotRef = new Map<string, VisualOverride>();

function emitChange() {
  snapshotRef = new Map(overrides);
  listeners.forEach(l => l());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function getSnapshot(): Map<string, VisualOverride> {
  return snapshotRef;
}

/** Hook to read visual overrides. Updates when overrides change. */
export function useVisualOverrides(): Map<string, VisualOverride> {
  return useSyncExternalStore(subscribe, getSnapshot);
}

/** Start the simulation. Call once from OfficePage. */
export function useAgentSimulation() {
  const intervalRef = useRef<ReturnType<typeof setInterval>>();

  useEffect(() => {
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) return;

    // Initialize overrides from current real state
    const agents = getAgents();
    agents.forEach(agent => {
      if (!overrides.has(agent.id)) {
        overrides.set(agent.id, { state: agent.state, zone: agent.zone });
      }
    });
    emitChange();

    intervalRef.current = setInterval(() => {
      const agents = getAgents();
      let changed = false;

      agents.forEach(agent => {
        if (!agent.enabled) return;

        // Get current visual state (or fall back to real state)
        const current = overrides.get(agent.id) ?? { state: agent.state, zone: agent.zone };
        const possible = transitions[current.state] || [];

        for (const t of possible) {
          if (Math.random() < t.chance) {
            overrides.set(agent.id, { state: t.next, zone: t.zone });
            changed = true;
            break;
          }
        }
      });

      // Sync: add new agents, remove deleted ones
      const agentIds = new Set(agents.map(a => a.id));
      for (const id of overrides.keys()) {
        if (!agentIds.has(id)) {
          overrides.delete(id);
          changed = true;
        }
      }
      for (const agent of agents) {
        if (!overrides.has(agent.id)) {
          overrides.set(agent.id, { state: agent.state, zone: agent.zone });
          changed = true;
        }
      }

      if (changed) emitChange();
    }, TICK_MS);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);
}
