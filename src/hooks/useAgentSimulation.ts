import { useEffect, useRef } from 'react';
import { getAgents, updateAgent } from '@/store/agentStore';
import { AgentState, OfficeZone, STATE_TO_ZONE } from '@/types/agent';

/**
 * Simulates agent behavior: 
 * - Working agents occasionally go on break or become idle
 * - On-break agents return to work
 * - Idle agents start working
 * - Sleeping agents stay sleeping unless enabled
 * Creates a living, breathing office feel.
 */

const TICK_MS = 4000; // check every 4 seconds

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

export function useAgentSimulation() {
  const intervalRef = useRef<ReturnType<typeof setInterval>>();

  useEffect(() => {
    // Check for reduced motion preference
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) return;

    intervalRef.current = setInterval(() => {
      const agents = getAgents();
      agents.forEach(agent => {
        if (!agent.enabled) return;
        const possible = transitions[agent.state] || [];
        for (const t of possible) {
          if (Math.random() < t.chance) {
            updateAgent(agent.id, {
              state: t.next,
              zone: t.zone,
            });
            break;
          }
        }
      });
    }, TICK_MS);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);
}
