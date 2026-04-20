import Fastify from "fastify";
import cors from "@fastify/cors";
import sensible from "@fastify/sensible";
import type { Db } from "./db/client.js";
import type { RuntimeAdapter } from "@homeroom/adapter-core";
import type { Config } from "./config.js";
import { ServiceError } from "./lib/errors.js";

// Repos
import { createAgentRepo } from "./repos/agent-repo.js";
import { createMemoryRepo } from "./repos/memory-repo.js";
import { createRuleRepo } from "./repos/rule-repo.js";
import { createPermissionRepo } from "./repos/permission-repo.js";
import { createScheduleRepo } from "./repos/schedule-repo.js";
import { createRunRepo } from "./repos/run-repo.js";
import { createTrustRepo } from "./repos/trust-repo.js";
import { createAuditRepo } from "./repos/audit-repo.js";
import { createSettingsRepo } from "./repos/settings-repo.js";
import { createRuntimeProjectionRepo } from "./repos/runtime-projection-repo.js";

// Services
import { createAuditService } from "./services/audit-service.js";
import { createTrustService } from "./services/trust-service.js";
import { createRuntimeService } from "./services/runtime-service.js";
import { createSettingsService } from "./services/settings-service.js";
import { createScheduleService } from "./services/schedule-service.js";
import { createRunService } from "./services/run-service.js";
import { createAgentService } from "./services/agent-service.js";
import { createFrontdeskService } from "./services/frontdesk-service.js";
import { createVaultService } from "./services/vault-service.js";
import { createSchedulerService } from "./services/scheduler-service.js";

// Routes
import { buildRuntimeRoutes } from "./routes/runtime.js";
import { buildSettingsRoutes } from "./routes/settings.js";
import { buildAgentRoutes } from "./routes/agents.js";
import { buildTrustRoutes } from "./routes/trust.js";
import { buildAuditRoutes } from "./routes/audit.js";
import { buildFrontdeskRoutes } from "./routes/frontdesk.js";
import { buildEventsRoutes } from "./routes/events.js";
import { buildCredentialsRoutes } from "./routes/credentials.js";
import { buildVaultRoutes } from "./routes/vault.js";

import { resolve } from "path";
import { homedir } from "os";

export async function buildApp(db: Db, adapter: RuntimeAdapter, config: Config, vaultRoot?: string) {
  const app = Fastify({
    logger: {
      level: config.logLevel,
    },
  });

  // ── CORS ──────────────────────────────────────────────────────────────────
  // Default: localhost only.
  // To allow preview-host origins (*.lovable.app), you must set BOTH:
  //   ALLOW_REMOTE_ORIGINS=true  AND  NODE_ENV=development
  // This prevents accidental remote access in production-like setups.
  const wantsRemote = process.env["ALLOW_REMOTE_ORIGINS"] === "true";
  const isDev = process.env["NODE_ENV"] === "development";
  const allowRemoteOrigins = wantsRemote && isDev;

  if (wantsRemote && !isDev) {
    app.log.warn(
      "⚠️  ALLOW_REMOTE_ORIGINS=true is set but NODE_ENV is not 'development'. " +
      "Remote origins will NOT be allowed. Set NODE_ENV=development to enable preview-host CORS.",
    );
  }
  if (allowRemoteOrigins) {
    app.log.warn(
      "⚠️  ALLOW_REMOTE_ORIGINS is active. Preview hosts (*.lovable.app, *.lovableproject.com) " +
      "can reach this backend. Any page on those hosts can manage agents, trigger runs, " +
      "and read/write credentials. Do NOT enable this on shared or public networks.",
    );
  }

  await app.register(cors, {
    origin: (origin, cb) => {
      if (
        !origin ||
        origin.startsWith("http://localhost") ||
        origin.startsWith("http://127.0.0.1")
      ) {
        cb(null, true);
      } else if (
        allowRemoteOrigins &&
        (origin.endsWith(".lovable.app") || origin.endsWith(".lovableproject.com"))
      ) {
        cb(null, true);
      } else {
        cb(new Error("Not allowed by CORS"), false);
      }
    },
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    credentials: true,
  });
  await app.register(sensible);

  // Wire up repos
  const agentRepo = createAgentRepo(db);
  const memoryRepo = createMemoryRepo(db);
  const ruleRepo = createRuleRepo(db);
  const permissionRepo = createPermissionRepo(db);
  const scheduleRepo = createScheduleRepo(db);
  const runRepo = createRunRepo(db);
  const trustRepo = createTrustRepo(db);
  const auditRepo = createAuditRepo(db);
  const settingsRepo = createSettingsRepo(db);
  const runtimeProjectionRepo = createRuntimeProjectionRepo(db);

  // Wire up services
  const auditService = createAuditService(auditRepo);
  const trustService = createTrustService(trustRepo);
  const runtimeService = createRuntimeService(adapter);
  const settingsService = createSettingsService(settingsRepo);
  const runService = createRunService(runRepo, agentRepo, runtimeProjectionRepo, adapter, auditService);
  const schedulerService = createSchedulerService(scheduleRepo, agentRepo, runService);
  const scheduleService = createScheduleService(scheduleRepo, agentRepo, schedulerService);
  const resolvedVaultRoot = vaultRoot ?? resolve(homedir(), ".homeroom", "vault");
  const vaultService = createVaultService(resolvedVaultRoot);
  const agentService = createAgentService(
    agentRepo,
    memoryRepo,
    ruleRepo,
    permissionRepo,
    scheduleRepo,
    runtimeProjectionRepo,
    trustService,
    auditService,
    adapter,
    vaultService,
  );
  const frontdeskService = createFrontdeskService(agentRepo, trustService, runtimeService);

  // Global error handler
  app.setErrorHandler((err, _req, reply) => {
    if (err instanceof ServiceError) {
      return reply.code(err.statusCode).send({ error: err.code, message: err.message });
    }
    app.log.error(err);
    return reply.code(500).send({ error: "INTERNAL_ERROR", message: "Something went wrong" });
  });

  // Root info route
  app.get("/", async (_req, reply) => {
    return reply.send({
      name: "Homeroom Service",
      version: "0.0.0",
      status: "ok",
      docs: "All endpoints are under /api/*",
      endpoints: [
        "GET  /api/runtime/health",
        "GET  /api/runtime/models",
        "GET  /api/settings",
        "GET  /api/agents",
        "GET  /api/trust/findings",
        "GET  /api/audit",
        "GET  /api/frontdesk/summary",
        "GET  /api/events/stream",
      ],
    });
  });

  // Register routes
  await app.register(buildRuntimeRoutes(runtimeService));
  await app.register(buildSettingsRoutes(settingsService));
  await app.register(buildAgentRoutes(agentService, runService, scheduleService, trustService, auditService));
  await app.register(buildTrustRoutes(trustService));
  await app.register(buildAuditRoutes(auditService));
  await app.register(buildFrontdeskRoutes(frontdeskService));
  await app.register(buildEventsRoutes());
  await app.register(buildCredentialsRoutes());
  await app.register(buildVaultRoutes(vaultService, agentService, memoryRepo, ruleRepo, permissionRepo, scheduleRepo, runRepo));

  // Import any pre-configured agents from the runtime adapter on first boot
  await agentService.importFromAdapter();

  return { app, agentService, runtimeService, vaultService, schedulerService };
}
