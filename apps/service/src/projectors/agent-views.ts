import type { AgentProfile, TrustFinding, RuntimeProjection } from "@homeroom/domain";
import type { MemoryItem, RuleItem } from "@homeroom/domain";
import type { PermissionProfile, Schedule } from "@homeroom/schemas";
import type { AgentSummaryView, AgentDetailView } from "@homeroom/contracts";
import type { TrustLevel } from "@homeroom/domain";

function computePosture(findings: TrustFinding[]): TrustLevel {
  if (findings.some((f) => f.level === "critical")) return "critical";
  if (findings.some((f) => f.level === "warning")) return "warning";
  if (findings.some((f) => f.level === "info")) return "info";
  return "ok";
}

export function toAgentSummaryView(
  profile: AgentProfile,
  findings: TrustFinding[],
): AgentSummaryView {
  return {
    id: profile.id,
    name: profile.name,
    purpose: profile.purpose,
    archetype: profile.archetype,
    vibe: profile.vibe,
    status: profile.status,
    enabled: profile.enabled,
    backgroundEnabled: profile.backgroundEnabled,
    runtimeMode: profile.runtimeMode,
    smartnessLevel: profile.smartnessLevel,
    sceneRoomId: profile.sceneRoomId,
    lastRunAt: profile.lastRunAt,
    lastRunStatus: profile.lastRunStatus,
    scheduleSummary: profile.scheduleSummary,
    trustPosture: computePosture(findings),
  };
}

export function toAgentDetailView(
  profile: AgentProfile,
  memoryItems: MemoryItem[],
  ruleItems: RuleItem[],
  permissionProfile: PermissionProfile | null,
  schedule: Schedule | null,
  runtime: RuntimeProjection | null,
  trustFindings: TrustFinding[],
): AgentDetailView {
  return {
    ...toAgentSummaryView(profile, trustFindings),
    role: profile.role,
    instructions: profile.instructions,
    audienceNotes: profile.audienceNotes,
    environmentNotes: profile.environmentNotes,
    memoryNotes: profile.memoryNotes,
    checkInFrequency: profile.checkInFrequency,
    escalationBehavior: profile.escalationBehavior,
    taskStyle: profile.taskStyle,
    notifyOnComplete: profile.notifyOnComplete,
    notifyOnError: profile.notifyOnError,
    memoryItems,
    ruleItems,
    permissionProfile,
    schedule,
    runtime,
    trustFindings,
    createdAt: profile.createdAt,
    updatedAt: profile.updatedAt,
  };
}
