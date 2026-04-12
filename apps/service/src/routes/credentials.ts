/**
 * Credentials API routes.
 *
 * Security model:
 *   - Keys are NEVER returned in responses; only masked representations.
 *   - Provider name is audit-logged on write/delete; key value is never logged.
 *   - Endpoints are rate-limited to 10 req/min per IP (in-memory counter).
 *   - Input validation: key must be a non-empty string, max 512 chars.
 */

import type { FastifyPluginAsync } from "fastify";
import {
  setCredential,
  deleteCredential,
  listCredentials,
  maskKey,
} from "../lib/credentials.js";
import { ServiceError } from "../lib/errors.js";

// ── rate limiter ───────────────────────────────────────────────────────────────

interface RateBucket {
  count: number;
  resetAt: number;
}

const rateBuckets = new Map<string, RateBucket>();
const RATE_LIMIT = 10;
const RATE_WINDOW_MS = 60_000;

function checkRateLimit(ip: string): void {
  const now = Date.now();
  let bucket = rateBuckets.get(ip);

  if (!bucket || now >= bucket.resetAt) {
    bucket = { count: 0, resetAt: now + RATE_WINDOW_MS };
    rateBuckets.set(ip, bucket);
  }

  bucket.count += 1;

  if (bucket.count > RATE_LIMIT) {
    throw new ServiceError(
      "Too many requests. Credentials endpoints are limited to 10 req/min per IP.",
      "RATE_LIMITED",
      429,
    );
  }
}

// Periodically prune expired buckets to prevent unbounded memory growth
setInterval(() => {
  const now = Date.now();
  for (const [ip, bucket] of rateBuckets) {
    if (now >= bucket.resetAt) rateBuckets.delete(ip);
  }
}, RATE_WINDOW_MS).unref?.();

// ── routes ────────────────────────────────────────────────────────────────────

export function buildCredentialsRoutes(): FastifyPluginAsync {
  return async (app) => {
    /**
     * GET /api/credentials
     * Returns all stored credentials with masked keys. Never returns actual values.
     */
    app.get("/api/credentials", async (req, reply) => {
      checkRateLimit(req.ip);
      const list = await listCredentials();
      return reply.send(list);
    });

    /**
     * POST /api/credentials/:provider
     * Body: { key: string }
     * Stores the credential encrypted at rest.
     * Returns: { ok: true, masked: string }
     */
    app.post<{ Params: { provider: string }; Body: unknown }>(
      "/api/credentials/:provider",
      async (req, reply) => {
        checkRateLimit(req.ip);

        const { provider } = req.params;

        // Validate body shape
        if (
          typeof req.body !== "object" ||
          req.body === null ||
          typeof (req.body as Record<string, unknown>)["key"] !== "string"
        ) {
          throw new ServiceError(
            "Request body must be { key: string }",
            "VALIDATION_ERROR",
            400,
          );
        }

        const key = ((req.body as Record<string, unknown>)["key"] as string).trim();

        if (key.length === 0) {
          throw new ServiceError("key must not be empty", "VALIDATION_ERROR", 400);
        }
        if (key.length > 512) {
          throw new ServiceError(
            "key exceeds maximum length of 512 characters",
            "VALIDATION_ERROR",
            400,
          );
        }

        await setCredential(provider, key);

        // Audit log: provider name only — key is never logged
        app.log.info({ event: "credential.set", provider }, "Credential stored");

        return reply.send({ ok: true, masked: maskKey(key) });
      },
    );

    /**
     * DELETE /api/credentials/:provider
     * Removes the stored credential for the given provider.
     * Returns: { ok: true }
     */
    app.delete<{ Params: { provider: string } }>(
      "/api/credentials/:provider",
      async (req, reply) => {
        checkRateLimit(req.ip);

        const { provider } = req.params;
        await deleteCredential(provider);

        // Audit log: provider name only
        app.log.info({ event: "credential.delete", provider }, "Credential deleted");

        return reply.send({ ok: true });
      },
    );
  };
}
