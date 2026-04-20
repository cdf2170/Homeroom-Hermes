import type { FastifyPluginAsync } from "fastify";
import type { SettingsService } from "../services/settings-service.js";
import { UpdateSettingsRequest } from "@homeroom/contracts";
import { ServiceError } from "../lib/errors.js";

export function buildSettingsRoutes(settingsService: SettingsService): FastifyPluginAsync {
  return async (app) => {
    app.get("/api/settings", async (_req, reply) => {
      return reply.send(await settingsService.get());
    });

    app.patch("/api/settings", async (req, reply) => {
      const parsed = UpdateSettingsRequest.safeParse(req.body);
      if (!parsed.success) {
        throw new ServiceError(parsed.error.message, "VALIDATION_ERROR", 400);
      }
      return reply.send(await settingsService.update(parsed.data));
    });
  };
}
