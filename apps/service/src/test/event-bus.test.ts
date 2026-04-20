import { describe, it, expect, vi, beforeEach } from "vitest";
import { subscribe, emit, initSequenceCursor, currentSequence, setDurableSink, EventPersistenceError } from "../lib/event-bus.js";

describe("EventBus", () => {
  beforeEach(() => {
    initSequenceCursor(0);
    setDurableSink(null);
  });

  it("delivers events to subscribers with sequence numbers", () => {
    const listener = vi.fn();
    const unsub = subscribe(listener);

    emit("run.started", { runId: "r1", agentId: "a1", trigger: "manual" });

    expect(listener).toHaveBeenCalledTimes(1);
    const event = listener.mock.calls[0]![0];
    expect(event.type).toBe("run.started");
    expect(event.payload).toEqual({ runId: "r1", agentId: "a1", trigger: "manual" });
    expect(event.sequence).toBe(1);
    expect(typeof event.createdAt).toBe("string");
    unsub();
  });

  it("assigns monotonic sequence numbers across emissions", () => {
    const listener = vi.fn();
    const unsub = subscribe(listener);

    emit("run.started", { runId: "r1", agentId: "a1", trigger: "manual" });
    emit("run.completed", { runId: "r1", agentId: "a1", status: "completed" });
    emit("agent.updated", { agentId: "a1" });

    const sequences = listener.mock.calls.map((c: any) => c[0].sequence);
    expect(sequences).toEqual([1, 2, 3]);
    unsub();
  });

  it("stops delivering after unsubscribe", () => {
    const listener = vi.fn();
    const unsub = subscribe(listener);
    unsub();

    emit("run.completed", { runId: "r1", agentId: "a1", status: "completed" });

    expect(listener).not.toHaveBeenCalled();
  });

  it("handles multiple subscribers", () => {
    const a = vi.fn();
    const b = vi.fn();
    const unsubA = subscribe(a);
    const unsubB = subscribe(b);

    emit("agent.updated", { agentId: "a1" });

    expect(a).toHaveBeenCalledTimes(1);
    expect(b).toHaveBeenCalledTimes(1);

    unsubA();
    unsubB();
  });

  it("does not crash if a listener throws", () => {
    const bad = vi.fn(() => { throw new Error("boom"); });
    const good = vi.fn();
    const unsub1 = subscribe(bad);
    const unsub2 = subscribe(good);

    emit("run.failed", { runId: "r1", agentId: "a1", error: "oops" });

    expect(bad).toHaveBeenCalledTimes(1);
    expect(good).toHaveBeenCalledTimes(1);

    unsub1();
    unsub2();
  });

  it("writes to the durable sink before delivering to subscribers", () => {
    const sunk: unknown[] = [];
    setDurableSink((event) => sunk.push(event));

    emit("agent.transition", {
      agentId: "a1",
      sceneState: "working",
      sceneRoomId: "mail",
    });

    expect(sunk.length).toBe(1);
    const event = sunk[0] as any;
    expect(event.type).toBe("agent.transition");
    expect(event.sequence).toBe(1);
  });

  it("initSequenceCursor resumes the counter after a restart", () => {
    initSequenceCursor(42);
    expect(currentSequence()).toBe(42);

    const listener = vi.fn();
    const unsub = subscribe(listener);

    emit("run.started", { runId: "r1", agentId: "a1", trigger: "manual" });

    expect(listener.mock.calls[0]![0].sequence).toBe(43);
    unsub();
  });

  // ── Fail-closed durability ──────────────────────────────────────────────────

  it("fails closed when the durable sink throws: no listener is notified and the sequence does not advance", () => {
    setDurableSink(() => { throw new Error("disk full"); });
    const listener = vi.fn();
    const unsub = subscribe(listener);

    const before = currentSequence();

    expect(() => {
      emit("run.started", { runId: "r1", agentId: "a1", trigger: "manual" });
    }).toThrow(EventPersistenceError);

    expect(listener).not.toHaveBeenCalled();
    expect(currentSequence()).toBe(before);
    unsub();
  });

  it("after a persistence failure, a later successful emit uses the next unused sequence", () => {
    const captured: unknown[] = [];
    setDurableSink(() => { throw new Error("transient"); });

    const listener = vi.fn();
    const unsub = subscribe(listener);

    expect(() => emit("agent.updated", { agentId: "a1" })).toThrow(EventPersistenceError);

    // Now the sink recovers
    setDurableSink((event) => { captured.push(event); });

    emit("agent.updated", { agentId: "a1" });

    expect(listener).toHaveBeenCalledTimes(1);
    expect(listener.mock.calls[0]![0].sequence).toBe(1);
    expect((captured[0] as any).sequence).toBe(1);
    unsub();
  });
});
