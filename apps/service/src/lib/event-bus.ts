/**
 * event-bus.ts
 *
 * Simple in-process event bus for SSE. Services emit events here;
 * the SSE endpoint subscribes and pushes them to connected clients.
 *
 * Events are typed to prevent drift between emitters and consumers.
 */

export interface EventMap {
  "run.started":   { runId: string; agentId: string };
  "run.completed":  { runId: string; agentId: string; status: string };
  "run.failed":     { runId: string; agentId: string; error: string };
  "agent.updated":  { agentId: string };
  "vault.synced":   { agentId: string };
  "schedule.fired": { agentId: string; scheduleId: string };
}

export type EventType = keyof EventMap;
export type EventPayload<T extends EventType> = EventMap[T];

type Listener = (type: EventType, payload: unknown) => void;

let listeners: Set<Listener> = new Set();

export function subscribe(fn: Listener): () => void {
  listeners.add(fn);
  return () => { listeners.delete(fn); };
}

export function emit<T extends EventType>(type: T, payload: EventPayload<T>): void {
  for (const fn of listeners) {
    try {
      fn(type, payload);
    } catch {
      // Don't let a broken listener crash the emitter
    }
  }
}

export const eventBus = { subscribe, emit };
