import { useState, useCallback, useSyncExternalStore } from 'react';
import { Agent } from '@/types/agent';
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
