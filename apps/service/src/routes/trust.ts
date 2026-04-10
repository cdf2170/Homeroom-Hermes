import type { FastifyPluginAsync } from "fastify";
import type { TrustService } from "../services/trust-service.js";
import type { TrustLevel } from "@homeroom/domain";

function computePosture(findings: { level: string }[]): TrustLevel {
  if (findings.some((f) => f.level === "critical")) return "critical";
  if (findings.some((f) => f.level === "warning")) return "warning";
  if (findings.some((f) => f.level === "info")) return "info";
  return "ok";
}

export function buildTrustRoutes(trustService: TrustService): FastifyPluginAsync {
  return async (app) => {
    app.get("/api/trust/findings", async (_req, reply) => {
      const findings = trustService.allFindings();
      const posture = computePosture(findings);
      const summary = {
        ok: "Everything looks good",
        info: "A few things worth reviewing",
        warning: "Some issues need your attention",
        critical: "Critical issues require action",
      }[posture];

      return reply.send({
        overallPosture: posture,
        summary,
        criticalCount: findings.filter((f) => f.level === "critical").length,
        warningCount: findings.filter((f) => f.level === "warning").length,
        infoCount: findings.filter((f) => f.level === "info").length,
        findings,
        checkedAt: new Date().toISOString(),
      });
    });
  };
}
