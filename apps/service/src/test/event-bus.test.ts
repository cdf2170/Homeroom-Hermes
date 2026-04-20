import { describe, it, expect, vi } from "vitest";
import { subscribe, emit } from "../lib/event-bus.js";

describe("EventBus", () => {
  it("delivers events to subscribers", () => {
    const listener = vi.fn();
    const unsub = subscribe(listener);

    emit("run.started", { runId: "r1", agentId: "a1" });

    expect(listener).toHaveBeenCalledTimes(1);
    expect(listener).toHaveBeenCalledWith("run.started", { runId: "r1", agentId: "a1" });
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
});
