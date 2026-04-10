import { z } from "zod";
import { RuntimeHealthSchema } from "@homeroom/domain";
import { AgentSummaryView } from "../views/agent-summary-view.js";
import { RunView } from "../views/run-view.js";
import { TrustFindingSchema } from "@homeroom/domain";

// SSE event payload schemas — definitions only; emitter wired in next phase.

export const SseEventType = z.enum([
  "ready",
  "runtime.health.updated",
  "agent.updated",
  "run.started",
  "run.completed",
  "run.failed",
  "trust.findings.updated",
  "sync.completed",
]);
export type SseEventType = z.infer<typeof SseEventType>;

export const SseReadyEvent = z.object({ type: z.literal("ready") });

export const SseRuntimeHealthEvent = z.object({
  type: z.literal("runtime.health.updated"),
  data: RuntimeHealthSchema,
});

export const SseAgentUpdatedEvent = z.object({
  type: z.literal("agent.updated"),
  data: AgentSummaryView,
});

export const SseRunEvent = z.object({
  type: z.union([
    z.literal("run.started"),
    z.literal("run.completed"),
    z.literal("run.failed"),
  ]),
  data: RunView,
});

export const SseTrustEvent = z.object({
  type: z.literal("trust.findings.updated"),
  data: z.object({
    agentId: z.string().uuid().nullable(),
    findings: z.array(TrustFindingSchema),
  }),
});
