/**
 * event-bus.ts
 *
 * In-process event bus with monotonic sequence numbers and optional
 * durable logging. Every event carries (sequence, type, createdAt, payload)
 * and can be replayed from any cursor.
 *
 * Events are typed via EventMap to prevent drift between emitters and
 * consumers. The event types mirror the v2 architecture plan exactly.
 */

// ── Event catalog (must match the v2 plan) ────────────────────────────────────

export interface EventMap {
  // Agent lifecycle
  "agent.created":     { agentId: string; name: string };
  "agent.updated":     { agentId: string };
  "agent.enabled":     { agentId: string };
  "agent.disabled":    { agentId: string };
  "agent.deleted":     { agentId: string; name: string };
  /** Emitted whenever sceneState or sceneRoomId changes. */
  "agent.transition":  {
    agentId: string;
    sceneState: string;
    sceneRoomId: string;
    reason?: string;
  };

  // Run lifecycle
  "run.started":       { runId: string; agentId: string; trigger: string };
  /** One structured step within a run (thought, tool_call, tool_result, message, error). */
  "run.step":          {
    runId: string;
    agentId: string;
    seq: number;
    kind: string;
    content: string;
  };
  "run.completed":     { runId: string; agentId: string; status: string };
  "run.failed":        { runId: string; agentId: string; error: string };
  "run.timeout":       { runId: string; agentId: string; timeoutSeconds: number };

  // Approvals
  "approval.requested": {
    approvalId: string;
    runId: string;
    agentId: string;
    kind: string;
    reason: string;
  };
  "approval.resolved":  {
    approvalId: string;
    runId: string;
    agentId: string;
    resolution: string;
  };

  // Schedule
  "schedule.fired":    { agentId: string; scheduleId: string };

  // Vault
  "vault.synced":      { agentId: string };
}

export type EventType = keyof EventMap;
export type EventPayload<T extends EventType> = EventMap[T];

/**
 * A single emitted event. Every consumer (SSE clients, durable log, tests)
 * sees the exact same shape.
 */
export interface StreamEvent {
  sequence: number;
  type: EventType;
  createdAt: string;   // ISO timestamp
  payload: unknown;
}

// ── Durable log hook (optional; set by app.ts on boot) ────────────────────────

type DurableSink = (event: StreamEvent) => void;
let durableSink: DurableSink | null = null;

export function setDurableSink(sink: DurableSink | null): void {
  durableSink = sink;
}

// ── Bus internals ─────────────────────────────────────────────────────────────

type Listener = (event: StreamEvent) => void;

let listeners: Set<Listener> = new Set();
let sequenceCounter = 0;

export function subscribe(fn: Listener): () => void {
  listeners.add(fn);
  return () => { listeners.delete(fn); };
}

export function emit<T extends EventType>(type: T, payload: EventPayload<T>): StreamEvent {
  sequenceCounter += 1;
  const event: StreamEvent = {
    sequence: sequenceCounter,
    type,
    createdAt: new Date().toISOString(),
    payload,
  };

  // Durable log first (so replay is correct even if a listener crashes)
  if (durableSink) {
    try {
      durableSink(event);
    } catch {
      // Never let logging errors break emission
    }
  }

  for (const fn of listeners) {
    try {
      fn(event);
    } catch {
      // Don't let a broken listener crash the emitter
    }
  }

  return event;
}

/**
 * Called on boot when the durable log is loaded from disk. Resets the
 * in-memory counter so new events continue after the last persisted one.
 */
export function initSequenceCursor(startAt: number): void {
  sequenceCounter = startAt;
}

export function currentSequence(): number {
  return sequenceCounter;
}

export const eventBus = { subscribe, emit, currentSequence, initSequenceCursor };
