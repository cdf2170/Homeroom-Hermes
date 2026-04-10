import type { AgentProfile } from "@homeroom/domain";
import type { PermissionProfile, Schedule } from "@homeroom/schemas";
import type { TrustFinding } from "@homeroom/domain";
import type { TrustRepo } from "../repos/trust-repo.js";
import { newId } from "../lib/ids.js";

const SECRET_REGEX = /sk-[A-Za-z0-9]{20,}|api[_-]?key\s*[:=]\s*\S+/i;

function makeFinding(
  partial: Omit<TrustFinding, "id" | "createdAt" | "scope" | "targetId">,
  scope: TrustFinding["scope"],
  targetId: string | null,
): Omit<TrustFinding, "createdAt"> {
  return { id: newId(), scope, targetId, ...partial };
}

/** Run all trust checks for an agent. Returns computed findings (not saved). */
export function computeAgentFindings(
  profile: AgentProfile,
  permission: PermissionProfile | null,
  schedule: Schedule | null,
  memoryContents: string[],
  ruleContents: string[],
): Omit<TrustFinding, "createdAt">[] {
  const findings: Omit<TrustFinding, "createdAt">[] = [];
  const agentId = profile.id;

  // 1. Cloud model active when agent marked local-only
  if (
    profile.runtimePreference === "local" &&
    profile.runtimeMode === "cloud"
  ) {
    findings.push(
      makeFinding(
        {
          level: "warning",
          code: "CLOUD_MODEL_LOCAL_ONLY",
          title: "Cloud model active for local-only agent",
          detail: "This agent is set to local-only but is currently configured to use a cloud model.",
          recommendedAction: 'Change Runtime Mode to "Local" or update the Runtime Preference.',
        },
        "agent",
        agentId,
      ),
    );
  }

  // 2. Background enabled but no approval gate
  if (
    profile.backgroundEnabled &&
    (!permission || permission.requiresApprovalFor.length === 0)
  ) {
    findings.push(
      makeFinding(
        {
          level: "warning",
          code: "BACKGROUND_NO_GATE",
          title: "Background mode enabled without approval gates",
          detail: "This agent can run in the background without requiring approval for any actions.",
          recommendedAction: "Add at least one approval requirement (e.g. file:write, shell:exec).",
        },
        "agent",
        agentId,
      ),
    );
  }

  // 3. Open network + broad tool access + background (triple risk)
  const networkAccessMode = (permission as (PermissionProfile & { networkAccessMode?: string }) | null)
    ?.networkAccessMode;
  if (
    networkAccessMode === "open" &&
    permission &&
    permission.toolScopes.length > 3 &&
    profile.backgroundEnabled
  ) {
    findings.push(
      makeFinding(
        {
          level: "critical",
          code: "AUTONOMOUS_OPEN_NETWORK",
          title: "Autonomous agent with unrestricted network access",
          detail:
            "This agent has open network access, broad tool permissions, and background mode enabled — the highest risk combination.",
          recommendedAction: "Restrict network access or reduce tool scopes, or require approval for all actions.",
        },
        "agent",
        agentId,
      ),
    );
  }

  // 4. Secret-like strings in memory/rules
  const allContent = [...memoryContents, ...ruleContents];
  const secretFound = allContent.some((c) => SECRET_REGEX.test(c));
  if (secretFound) {
    findings.push(
      makeFinding(
        {
          level: "critical",
          code: "SECRET_IN_CONTENT",
          title: "Possible secret key found in memory or rules",
          detail: "A string matching a known secret pattern was found in this agent's memory or rules.",
          recommendedAction:
            "Remove the secret and store it in Settings > Providers instead.",
        },
        "agent",
        agentId,
      ),
    );
  }

  // 5. Schedule enabled but agent disabled
  if (schedule?.enabled && !profile.enabled) {
    findings.push(
      makeFinding(
        {
          level: "warning",
          code: "SCHEDULE_AGENT_DISABLED",
          title: "Schedule active but agent is disabled",
          detail: "The schedule is enabled but the agent itself is disabled — the schedule will not run.",
          recommendedAction: "Enable the agent or disable the schedule.",
        },
        "agent",
        agentId,
      ),
    );
  }

  // 6. Drift placeholder — always ok this phase
  // TODO(phase-3): add drift check once compiler is implemented

  return findings;
}

export function createTrustService(trustRepo: TrustRepo) {
  return {
    async evaluateAgent(
      profile: AgentProfile,
      permission: PermissionProfile | null,
      schedule: Schedule | null,
      memoryContents: string[],
      ruleContents: string[],
    ): Promise<TrustFinding[]> {
      const computed = computeAgentFindings(profile, permission, schedule, memoryContents, ruleContents);
      return trustRepo.replaceForTarget("agent", profile.id, computed);
    },

    findingsForAgent(agentId: string): TrustFinding[] {
      return trustRepo.findByTarget("agent", agentId);
    },

    allFindings(): TrustFinding[] {
      return trustRepo.findAll();
    },
  };
}

export type TrustService = ReturnType<typeof createTrustService>;
