import type { AgentProfile } from "@homeroom/domain";
import type { PermissionProfile, Schedule } from "@homeroom/schemas";
import type { TrustFinding } from "@homeroom/domain";
import type { TrustRepo } from "../repos/trust-repo.js";
import { newId } from "../lib/ids.js";

const SECRET_REGEX = /sk-[A-Za-z0-9]{20,}|api[_-]?key\s*[:=]\s*\S+/i;

/**
 * Approval scope strings the run-service actually enforces at dispatch.
 * Other strings in requiresApprovalFor are metadata only today and should
 * be flagged by the trust engine so the UI doesn't claim enforcement we
 * don't provide.
 */
const ENFORCED_SCOPES = new Set(["schedule", "background", "autonomous"]);

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
  /** Lowercased provider ids with a real encrypted credential stored. */
  connectedProviders: ReadonlySet<string> = new Set(),
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

  // 6. Permission profile claims approval scopes the backend does not enforce
  if (permission && permission.requiresApprovalFor.length > 0) {
    const unsupported = permission.requiresApprovalFor.filter(
      (scope) => !ENFORCED_SCOPES.has(scope),
    );
    if (unsupported.length > 0) {
      findings.push(
        makeFinding(
          {
            level: "warning",
            code: "UNSUPPORTED_APPROVAL_SCOPE",
            title: "Approval scope is not actually enforced",
            detail:
              `This agent's permission profile requires approval for [${unsupported.join(", ")}], ` +
              `but the backend only enforces pre-dispatch gates on autonomous triggers ` +
              `("schedule", "background", "autonomous"). The listed scopes are metadata only today.`,
            recommendedAction:
              "Remove unsupported scopes, or add one of \"schedule\", \"background\", \"autonomous\" " +
              "if the intent is to gate unattended runs.",
          },
          "agent",
          agentId,
        ),
      );
    }
  }

  // 7. networkAccessMode "limited" is accepted by the schema but currently
  //    behaves like "open". Surface that honestly so users don't treat it
  //    as a real safety boundary.
  if (
    (permission as (PermissionProfile & { networkAccessMode?: string }) | null)
      ?.networkAccessMode === "limited"
  ) {
    findings.push(
      makeFinding(
        {
          level: "warning",
          code: "NETWORK_MODE_LIMITED_UNENFORCED",
          title: '"Limited" network mode is not yet enforced',
          detail:
            'This agent is set to "limited" network access, but the backend has no allowlist ' +
            "implementation yet. At dispatch time this behaves like \"open\".",
          recommendedAction:
            'If you want to block network access, choose "off". If you want full network access, choose "open".',
        },
        "agent",
        agentId,
      ),
    );
  }

  // 8. Schedule enabled + agent enabled + background enabled, but no
  //    autonomous approval gate. Means the agent can run unattended with
  //    no human-in-the-loop check.
  const gatesAutonomous = permission
    ? permission.requiresApprovalFor.some((s) => ENFORCED_SCOPES.has(s))
    : false;
  if (
    schedule?.enabled &&
    profile.enabled &&
    profile.backgroundEnabled &&
    !gatesAutonomous
  ) {
    findings.push(
      makeFinding(
        {
          level: "warning",
          code: "SCHEDULE_NO_AUTONOMOUS_GATE",
          title: "Scheduled agent runs without approval gates",
          detail:
            "This agent is scheduled, enabled, and allowed to run in the background, " +
            "but no autonomous-trigger approval is configured. Scheduled runs will dispatch without asking.",
          recommendedAction:
            'Add "schedule" or "autonomous" to the requires-approval list if you want to review runs before they dispatch.',
        },
        "agent",
        agentId,
      ),
    );
  }

  // 9. Agent's selected model points at a provider with no stored credential.
  //    Without a credential the run will fail as soon as hermes is dispatched.
  if (profile.modelRef) {
    const providerId = profile.modelRef.split("/")[0]?.toLowerCase();
    if (providerId && providerId !== "local" && !connectedProviders.has(providerId)) {
      findings.push(
        makeFinding(
          {
            level: "warning",
            code: "MODEL_PROVIDER_NO_CREDENTIAL",
            title: "Selected model's provider has no stored credential",
            detail:
              `This agent is set to use ${profile.modelRef}, but no credential for the ` +
              `"${providerId}" provider is stored. Runs will fail at dispatch.`,
            recommendedAction: `Add an API key for ${providerId} in Settings, or pick a different model.`,
          },
          "agent",
          agentId,
        ),
      );
    }
  }

  return findings;
}

export function createTrustService(
  trustRepo: TrustRepo,
  /**
   * Returns the set of lowercased provider ids that currently have a real
   * encrypted credential stored. Optional -- if absent, the
   * MODEL_PROVIDER_NO_CREDENTIAL finding is not evaluated.
   */
  connectedProvidersLookup?: () => Promise<Set<string>>,
) {
  return {
    async evaluateAgent(
      profile: AgentProfile,
      permission: PermissionProfile | null,
      schedule: Schedule | null,
      memoryContents: string[],
      ruleContents: string[],
    ): Promise<TrustFinding[]> {
      const connectedProviders = connectedProvidersLookup
        ? await connectedProvidersLookup()
        : new Set<string>();
      const computed = computeAgentFindings(
        profile,
        permission,
        schedule,
        memoryContents,
        ruleContents,
        connectedProviders,
      );
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
