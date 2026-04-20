import type { FastifyPluginAsync } from "fastify";
import { subscribe } from "../lib/event-bus.js";
import type { EventType } from "../lib/event-bus.js";

/**
 * SSE endpoint — streams real-time events to connected clients.
 *
 * Emits:
 *   - run.started, run.completed, run.failed (from run service)
 *   - agent.updated (from agent service)
 *   - vault.synced (from vault sync)
 *
 * Clients receive JSON payloads:
 *   data: {"type":"run.completed","payload":{"runId":"...","agentId":"..."}}
 */
export function buildEventsRoutes(): FastifyPluginAsync {
  return async (app) => {
    app.get("/api/events/stream", async (req, reply) => {
      reply.raw.setHeader("Content-Type", "text/event-stream");
      reply.raw.setHeader("Cache-Control", "no-cache");
      reply.raw.setHeader("Connection", "keep-alive");
      reply.raw.setHeader("X-Accel-Buffering", "no");
      reply.raw.flushHeaders();

      // Send initial ready event
      reply.raw.write('data: {"type":"ready"}\n\n');

      // Subscribe to the event bus
      const unsubscribe = subscribe((type: EventType, payload: unknown) => {
        if (reply.raw.destroyed) return;
        const data = JSON.stringify({ type, payload });
        reply.raw.write(`data: ${data}\n\n`);
      });

      // Keep connection alive with periodic comments
      const keepAlive = setInterval(() => {
        if (reply.raw.destroyed) {
          clearInterval(keepAlive);
          return;
        }
        reply.raw.write(": ping\n\n");
      }, 15_000);

      req.raw.on("close", () => {
        clearInterval(keepAlive);
        unsubscribe();
      });
    });
  };
}
