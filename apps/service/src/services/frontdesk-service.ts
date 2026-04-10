import type { AgentRepo } from "../repos/agent-repo.js";
import type { TrustService } from "./trust-service.js";
import type { RuntimeService } from "./runtime-service.js";
import type { FrontdeskView } from "@homeroom/contracts";
import type { TrustLevel } from "@homeroom/domain";

function computePosture(findings: { level: string }[]): TrustLevel {
  if (findings.some((f) => f.level === "critical")) return "critical";
  if (findings.some((f) => f.level === "warning")) return "warning";
  if (findings.some((f) => f.level === "info")) return "info";
  return "ok";
}

const POSTURE_SUMMARY: Record<TrustLevel, string> = {
  ok: "Everything looks good",
  info: "A few things worth reviewing",
  warning: "Some issues need your attention",
  critical: "Critical issues require action",
};

export function createFrontdeskService(
  agentRepo: AgentRepo,
  trustService: TrustService,
  runtimeService: RuntimeService,
) {
  return {
    async summary(): Promise<FrontdeskView> {
      const [allAgents, allFindings, runtime] = await Promise.all([
        Promise.resolve(agentRepo.findAll()),
        Promise.resolve(trustService.allFindings()),
        runtimeService.health(),
      ]);

      const enabledAgents = allAgents.filter((a) => a.enabled);
      const overallPosture = computePosture(allFindings);

      const agentsNeedingAttention = allAgents
        .map((a) => {
          const agentFindings = allFindings.filter((f) => f.targetId === a.id);
          const posture = computePosture(agentFindings);
          return {
            id: a.id,
            name: a.name,
            status: a.status,
            trustPosture: posture,
            hasActiveSchedule: !!a.scheduleSummary,
            lastRunAt: a.lastRunAt,
          };
        })
        .filter((a) => a.trustPosture !== "ok");

      const onboardingGaps: string[] = [];
      if (allAgents.length === 0) onboardingGaps.push("Create your first agent to get started");
      if (!runtime.openclawInstalled) onboardingGaps.push("OpenClaw is not installed");
      if (!runtime.gatewayReachable) onboardingGaps.push("OpenClaw gateway is not reachable");

      return {
        overallPosture,
        postureSummary: POSTURE_SUMMARY[overallPosture],
        agentCount: allAgents.length,
        enabledAgentCount: enabledAgents.length,
        agentsNeedingAttention,
        onboardingGaps,
        runtime,
      };
    },
  };
}

export type FrontdeskService = ReturnType<typeof createFrontdeskService>;
