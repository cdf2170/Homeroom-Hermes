/**
 * events.ts
 *
 * Two endpoints:
 *
 *   GET /api/events/stream        -- SSE stream of live events with sequence numbers.
 *                                    Optional ?since=<seq> replays missed events first.
 *   GET /api/events?since=<seq>   -- Targeted replay of events strictly after <seq>.
 *                                    Used by the client for gap recovery.
 */

import type { FastifyPluginAsync } from "fastify";
import { subscribe, currentSequence } from "../lib/event-bus.js";
import type { StreamEvent } from "../lib/event-bus.js";
import type { StreamEventRepo } from "../repos/stream-event-repo.js";

export function buildEventsRoutes(streamEventRepo: StreamEventRepo): FastifyPluginAsync {
  return async (app) => {
    // ── SSE stream ────────────────────────────────────────────────────────────
    app.get<{ Querystring: { since?: string } }>("/api/events/stream", async (req, reply) => {
      const sinceRaw = req.query.since;
      const since = sinceRaw != null ? parseInt(sinceRaw, 10) : null;

      reply.raw.setHeader("Content-Type", "text/event-stream");
      reply.raw.setHeader("Cache-Control", "no-cache");
      reply.raw.setHeader("Connection", "keep-alive");
      reply.raw.setHeader("X-Accel-Buffering", "no");
      reply.raw.flushHeaders();

      const write = (event: StreamEvent) => {
        if (reply.raw.destroyed) return;
        reply.raw.write(`id: ${event.sequence}\n`);
        reply.raw.write(`data: ${JSON.stringify(event)}\n\n`);
      };

      // 1. Send initial cursor frame so the client knows where it is.
      const cursor = currentSequence();
      reply.raw.write(`data: ${JSON.stringify({ type: "ready", cursor })}\n\n`);

      // 2. If the client sent ?since=N, replay any events we have after N.
      //    This catches them up before live events start flowing.
      if (since != null && Number.isFinite(since) && since < cursor) {
        const missed = streamEventRepo.findAfter(since);
        for (const event of missed) {
          write(event);
        }
      }

      // 3. Subscribe to live events.
      const unsubscribe = subscribe((event) => write(event));

      // 4. Keep-alive ping every 15s.
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

    // ── Targeted replay (for client-initiated gap recovery) ───────────────────
    app.get<{ Querystring: { since?: string; through?: string } }>(
      "/api/events",
      async (req, reply) => {
        const since = parseInt(req.query.since ?? "0", 10);
        const through = req.query.through ? parseInt(req.query.through, 10) : undefined;

        if (!Number.isFinite(since)) {
          return reply.code(400).send({ error: "INVALID_CURSOR", message: "?since must be an integer" });
        }

        const events = through != null && Number.isFinite(through)
          ? streamEventRepo.findRange(since, through)
          : streamEventRepo.findAfter(since);

        return reply.send({ cursor: currentSequence(), events });
      },
    );
  };
}
