import type { AgentRepo } from "../repos/agent-repo.js";
import type { MemoryRepo } from "../repos/memory-repo.js";
import type { RuleRepo } from "../repos/rule-repo.js";
import type { PermissionRepo } from "../repos/permission-repo.js";
import type { ScheduleRepo } from "../repos/schedule-repo.js";
import type { RuntimeProjectionRepo } from "../repos/runtime-projection-repo.js";
import type { TrustService } from "./trust-service.js";
import type { AuditService } from "./audit-service.js";
import type { RuntimeAdapter } from "@homeroom/adapter-core";
import type { CreateAgentRequest, UpdateAgentRequest } from "@homeroom/contracts";
import type { AgentProfile } from "@homeroom/domain";
import type { VaultService } from "./vault-service.js";
import { now } from "../lib/time.js";
import { emit } from "../lib/event-bus.js";

// ── Appearance helpers ────────────────────────────────────────────────────────

const OUTFIT_PALETTE = ['#6366f1', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#3b82f6', '#ef4444', '#14b8a6', '#5B8C5A', '#C06030', '#4A6FA5', '#9B59B6', '#2C3E50'];
const SKIN_TONES = ['#FDDBB4', '#F1C27D', '#D2A679', '#8D5524', '#6B3A2A'];
const HAIR_COLORS = ['#1A1A1A', '#3B2716', '#A0522D', '#D4A44C', '#4A4A4A'];
const HAIR_STYLES = ['short', 'long', 'curly', 'buzz', 'ponytail', 'bun', 'wavy', 'afro'];
const BODY_TYPES = ['masculine', 'feminine'];

function seededRandom(seed: string): () => number {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = seed.charCodeAt(i) + ((h << 5) - h);
  return () => { h = (h * 16807 + 0) % 2147483647; return (h & 0x7fffffff) / 2147483647; };
}

function generateDefaultAppearance(name: string): Record<string, unknown> {
  const rng = seededRandom(name);
  const pick = <T>(arr: T[]): T => arr[Math.floor(rng() * arr.length)] as T;
  return {
    bodyType: pick(BODY_TYPES),
    skinTone: pick(SKIN_TONES),
    hairStyle: pick(HAIR_STYLES),
    hairColor: pick(HAIR_COLORS),
    outfitStyle: 'casual',
    outfitColor: pick(OUTFIT_PALETTE),
    accentColor: pick(OUTFIT_PALETTE),
    shoeColor: '#333',
    glasses: 'none',
    headwear: 'none',
  };
}

export function createAgentService(
  agentRepo: AgentRepo,
  memoryRepo: MemoryRepo,
  ruleRepo: RuleRepo,
  permissionRepo: PermissionRepo,
  scheduleRepo: ScheduleRepo,
  runtimeProjectionRepo: RuntimeProjectionRepo,
  trustService: TrustService,
  auditService: AuditService,
  adapter: RuntimeAdapter,
  vaultService?: VaultService,
) {
  function syncVault(agentId: string) {
    if (!vaultService) return;
    try {
      const profile = agentRepo.findById(agentId);
      const memoryItems = memoryRepo.findByAgentId(agentId);
      const ruleItems   = ruleRepo.findByAgentId(agentId);
      const perm        = permissionRepo.findByAgentId(agentId);
      const schedule    = scheduleRepo.findByAgentId(agentId);
      vaultService.syncAgent(profile, memoryItems as any, ruleItems as any, perm as any, schedule as any);
    } catch {
      // vault sync is best-effort — never block the main path
    }
  }

  async function runTrustChecks(agentId: string) {
    const profile = agentRepo.findById(agentId);
    const permission = permissionRepo.findByAgentId(agentId);
    const schedule = scheduleRepo.findByAgentId(agentId);
    const memories = memoryRepo.findByAgentId(agentId).map((m) => m.content);
    const rules = ruleRepo.findByAgentId(agentId).map((r) => r.content);
    await trustService.evaluateAgent(profile, permission, schedule, memories, rules);
  }

  return {
    list(): AgentProfile[] {
      return agentRepo.findAll();
    },

    getById(id: string): AgentProfile {
      return agentRepo.findById(id);
    },

    getDetail(id: string) {
      const profile = agentRepo.findById(id);
      const memoryItems = memoryRepo.findByAgentId(id);
      const ruleItems = ruleRepo.findByAgentId(id);
      const permissionProfile = permissionRepo.findByAgentId(id);
      const schedule = scheduleRepo.findByAgentId(id);
      const runtime = runtimeProjectionRepo.findByAgentId(id);
      const trustFindings = trustService.findingsForAgent(id);
      return { profile, memoryItems, ruleItems, permissionProfile, schedule, runtime, trustFindings };
    },

    async create(req: CreateAgentRequest): Promise<AgentProfile> {
      const defaultAppearance = generateDefaultAppearance(req.name);
      const profile = agentRepo.insert({
        name: req.name,
        purpose: req.purpose ?? "",
        archetype: req.archetype,
        vibe: req.vibe,
        smartnessLevel: req.smartnessLevel,
        runtimeMode: req.runtimeMode,
        runtimePreference: req.runtimeMode,
        enabled: false,
        backgroundEnabled: false,
        status: "offline",
        sceneRoomId: "focus",
        sceneState: "idle",
        lastRunAt: null,
        lastRunStatus: null,
        scheduleSummary: null,
        permissionProfileId: null,
        appearanceId: null,
        appearance: JSON.stringify(defaultAppearance),
        role: "",
        instructions: "",
        audienceNotes: "",
        environmentNotes: "",
        memoryNotes: "",
        checkInFrequency: "on_completion",
        escalationBehavior: "ask",
        taskStyle: "methodical",
        notifyOnComplete: true,
        notifyOnError: true,
      });

      // Create default permission profile
      permissionRepo.upsert(profile.id, {});

      auditService.append({
        actor: "user",
        sourceMode: "user",
        eventType: "agent.created",
        targetType: "agent",
        targetId: profile.id,
        summary: `Agent "${profile.name}" created`,
        permissionContext: null,
        runId: null,
      });

      emit("agent.created", { agentId: profile.id, name: profile.name });

      await runTrustChecks(profile.id);
      syncVault(profile.id);
      return profile;
    },

    async update(id: string, req: UpdateAgentRequest): Promise<AgentProfile> {
      const before = agentRepo.findById(id);
      const updated = agentRepo.update(id, req);

      // Detect enable/disable state changes for specific audit + event bus events
      if (req.enabled !== undefined && req.enabled !== before.enabled) {
        auditService.append({
          actor: "user",
          sourceMode: "user",
          eventType: req.enabled ? "agent.enabled" : "agent.disabled",
          targetType: "agent",
          targetId: id,
          summary: `Agent "${updated.name}" ${req.enabled ? "enabled" : "disabled"}`,
          permissionContext: null,
          runId: null,
        });
        if (req.enabled) emit("agent.enabled", { agentId: id });
        else emit("agent.disabled", { agentId: id });
      }

      auditService.append({
        actor: "user",
        sourceMode: "user",
        eventType: "agent.updated",
        targetType: "agent",
        targetId: id,
        summary: `Agent "${updated.name}" updated`,
        permissionContext: null,
        runId: null,
      });

      emit("agent.updated", { agentId: id });

      await runTrustChecks(id);
      syncVault(id);
      return updated;
    },

    async delete(id: string): Promise<void> {
      const profile = agentRepo.findById(id);
      // Cascade cleanup
      memoryRepo.deleteByAgentId(id);
      ruleRepo.deleteByAgentId(id);
      permissionRepo.deleteByAgentId(id);
      scheduleRepo.deleteByAgentId(id);
      runtimeProjectionRepo.deleteByAgentId(id);

      const profileName = profile.name;
      agentRepo.delete(id);
      vaultService?.deleteAgent(id, profileName);

      auditService.append({
        actor: "user",
        sourceMode: "user",
        eventType: "agent.deleted",
        targetType: "agent",
        targetId: id,
        summary: `Agent "${profile.name}" deleted`,
        permissionContext: null,
        runId: null,
      });

      emit("agent.deleted", { agentId: id, name: profileName });
    },

    /** Called on first boot — imports mock/adapter agents as Homeroom profiles. */
    async importFromAdapter(): Promise<void> {
      const existing = agentRepo.findAll();
      if (existing.length > 0) return; // already seeded

      const adapterAgents = await adapter.listAgents();
      for (const a of adapterAgents) {
        const profile = agentRepo.insert({
          name: a.name,
          purpose: "Imported from OpenClaw workspace",
          archetype: "helper",
          vibe: "calm",
          smartnessLevel: "standard",
          runtimeMode: "local",
          runtimePreference: "local",
          enabled: false,
          backgroundEnabled: false,
          status: "offline",
          sceneRoomId: "focus",
          sceneState: "idle",
          lastRunAt: null,
          lastRunStatus: null,
          scheduleSummary: null,
          permissionProfileId: null,
          appearanceId: null,
          role: "",
          instructions: "",
          audienceNotes: "",
          environmentNotes: "",
          memoryNotes: "",
          checkInFrequency: "on_completion",
          escalationBehavior: "ask",
          taskStyle: "methodical",
          notifyOnComplete: true,
          notifyOnError: true,
        });

        runtimeProjectionRepo.upsert(profile.id, {
          backendRef: a.backendRef,
          workspacePath: a.workspacePath,
          modelRef: a.modelRef,
          state: a.state === "unknown" ? "unknown" : (a.state as AgentProfile["status"] extends string ? "idle" : never) ?? "idle",
          schedulerState: a.schedulerActive ? "active" : "inactive",
          lastSyncedAt: now(),
        });

        permissionRepo.upsert(profile.id, {});
      }
    },
  };
}

export type AgentService = ReturnType<typeof createAgentService>;
