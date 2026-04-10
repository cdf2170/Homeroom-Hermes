import type { FastifyPluginAsync } from "fastify";

// SSE endpoint — emits a "ready" ping only in this phase.
// Phase 3+: emit agent.updated, run.*, trust.findings.updated events.
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

      // Keep connection alive with periodic comments
      const keepAlive = setInterval(() => {
        if (reply.raw.destroyed) {
          clearInterval(keepAlive);
          return;
        }
        reply.raw.write(": ping\n\n");
      }, 15_000);

      req.raw.on("close", () => clearInterval(keepAlive));
    });
  };
}
