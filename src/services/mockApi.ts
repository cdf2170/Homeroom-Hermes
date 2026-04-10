import type { Agent, AgentState, OfficeZone, RunRecord } from '@/types/agent';
import type {
  AgentSummaryView, AgentProfileView, RunView, ScheduleView,
  TrustFindingView, RuntimeHealthView, SettingsView, FindingSeverity,
} from '@/types/views';
import type { HomeroomApi } from './api';
import {
  useAgents as useAgentsStore,
  getAgents, addAgent, updateAgent as storeUpdate,
  removeAgent,
} from '@/store/agentStore';
import { STATE_LABELS } from '@/types/agent';
import { hasProviderKey } from '@/store/modelConfigStore';
import { toast } from 'sonner';

// ── Mappers ──

function toSummary(a: Agent): AgentSummaryView {
  return {
    id: a.id,
    name: a.name,
    role: a.role,
    purpose: a.purpose,
    state: a.state,
    zone: a.zone,
    runtimeMode: a.runtimeMode,
    smartnessLevel: a.smartnessLevel,
    enabled: a.enabled,
    backgroundEnabled: a.backgroundEnabled,
    currentTask: a.currentTask,
    lastRunAt: a.lastRunAt,
    lastRunStatus: a.lastRunStatus,
    scheduleSummary: a.scheduleSummary,
    outfitColor: a.appearance.outfitColor,
    initial: a.name[0] || '?',
    runCount: a.runs.length,
    needsAttention: a.state === 'waiting' || a.state === 'needs-attention',
    hasPermissions: !!a.permissions,
  };
}

function toProfile(a: Agent): AgentProfileView {
  return { ...a };
}

function toRunView(r: RunRecord, agentName: string, agentColor: string): RunView {
  return {
    id: r.id,
    agentId: r.agentId,
    agentName,
    agentColor,
    trigger: r.trigger,
    status: r.status,
    startedAt: r.startedAt,
    finishedAt: r.finishedAt,
    durationMs: r.finishedAt ? r.finishedAt.getTime() - r.startedAt.getTime() : null,
    inputSummary: r.inputSummary,
    outputSummary: r.outputSummary,
    errorSummary: r.errorSummary,
    backendRef: r.backendRef,
  };
}

function toScheduleView(a: Agent): ScheduleView | null {
  if (!a.schedule) return null;
  return {
    id: a.schedule.id,
    agentId: a.id,
    agentName: a.name,
    enabled: a.schedule.enabled,
    preset: a.schedule.preset,
    plainEnglish: a.schedule.plainEnglish,
    backendExpression: a.schedule.backendExpression,
    nextRunAt: a.schedule.nextRunAt,
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
  };
}

// ── Trust analysis ──

function analyzeTrust(agents: Agent[]): TrustFindingView[] {
  const findings: TrustFindingView[] = [];

  const cloudAgents = agents.filter(a => a.runtimeMode === 'cloud' || a.runtimeMode === 'hybrid');
  const bgAgents = agents.filter(a => a.backgroundEnabled);

  if (cloudAgents.length > 0) {
    findings.push({
      id: 'cloud-agents', severity: 'informational',
      title: `${cloudAgents.length} agent${cloudAgents.length > 1 ? 's' : ''} use cloud models`,
      detail: 'These agents send data to external AI providers. Make sure you trust the provider.',
    });
  }

  if (bgAgents.length > 0) {
    findings.push({
      id: 'bg-agents', severity: 'informational',
      title: `${bgAgents.length} agent${bgAgents.length > 1 ? 's' : ''} can run in the background`,
      detail: 'Background agents can work without you watching. Review their schedules and permissions.',
    });
  }

  agents.forEach(a => {
    if (!a.permissions && a.enabled) {
      findings.push({
        id: `no-perms-${a.id}`, severity: 'review', agentId: a.id, agentName: a.name,
        title: `${a.name} has no guardrails set`,
        detail: 'This agent has no explicit permission boundaries. Consider adding rules and tool limits.',
      });
    }
    if (a.permissions?.networkAccess && a.runtimeMode === 'local') {
      findings.push({
        id: `net-local-${a.id}`, severity: 'informational', agentId: a.id, agentName: a.name,
        title: `${a.name} has internet access but runs locally`,
        detail: 'It can still reach external services even though the model runs on your device.',
      });
    }
    if (a.permissions?.toolScopes && a.permissions.toolScopes.length > 5) {
      findings.push({
        id: `broad-tools-${a.id}`, severity: 'review', agentId: a.id, agentName: a.name,
        title: `${a.name} has broad tool access (${a.permissions.toolScopes.length} tools)`,
        detail: 'Consider limiting to only the tools this agent actually needs.',
      });
    }
    if (a.backgroundEnabled && (!a.permissions || a.permissions.requiresApprovalFor.length === 0)) {
      findings.push({
        id: `bg-no-approval-${a.id}`, severity: 'review', agentId: a.id, agentName: a.name,
        title: `${a.name} runs in background with no approval requirements`,
        detail: 'Background agents without approval gates can act fully autonomously.',
      });
    }
    if (a.ruleItems.length === 0 && a.enabled) {
      findings.push({
        id: `no-rules-${a.id}`, severity: 'informational', agentId: a.id, agentName: a.name,
        title: `${a.name} has no explicit rules`,
        detail: 'Adding rules helps keep agent behavior predictable and safe.',
      });
    }
  });

  if (findings.length === 0) {
    findings.push({
      id: 'all-good', severity: 'ok',
      title: 'Everything looks good',
      detail: 'No issues detected. Your agents are configured safely.',
    });
  }

  return findings;
}

// ── Settings store (localStorage) ──

const SETTINGS_KEY = 'homeroom-settings';

function loadSettings(): SettingsView {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return {
    displayName: 'Manager',
    serviceMode: 'demo',
    defaultRuntime: 'local',
    requireApprovalByDefault: true,
    backgroundOffByDefault: true,
    ambientAnimations: true,
    agentIdleAnimations: true,
    notifyOnAttention: true,
    notifyOnComplete: true,
  };
}

function saveSettings(s: SettingsView) {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(s));
}

// ── Implementation ──

export const mockApi: HomeroomApi = {
  listAgents() {
    return getAgents().map(toSummary);
  },

  getAgent(id) {
    const a = getAgents().find(a => a.id === id);
    return a ? toProfile(a) : null;
  },

  createAgent(agent) {
    addAgent(agent);
  },

  updateAgent(id, updates) {
    storeUpdate(id, updates);
  },

  deleteAgent(id) {
    removeAgent(id);
  },

  setAgentState(id, state, zone) {
    const zoneMap: Record<AgentState, OfficeZone> = {
      working: 'work', walking: 'work', idle: 'work',
      'on-break': 'lounge', waiting: 'approval', paused: 'work',
      offline: 'quiet', sleeping: 'quiet', 'needs-attention': 'approval',
    };
    const agents = getAgents();
    const agent = agents.find(a => a.id === id);
    if (!agent) return;
    storeUpdate(id, {
      state,
      zone: zone ?? zoneMap[state],
      activities: [
        { id: `act-${Date.now()}`, timestamp: new Date(), action: 'State Change', detail: `Status changed to ${STATE_LABELS[state]}` },
        ...agent.activities,
      ],
    });
  },

  listRuns() {
    return getAgents()
      .flatMap(a => a.runs.map(r => toRunView(r, a.name, a.appearance.outfitColor)))
      .sort((a, b) => b.startedAt.getTime() - a.startedAt.getTime());
  },

  getRun(id) {
    for (const a of getAgents()) {
      const r = a.runs.find(r => r.id === id);
      if (r) return toRunView(r, a.name, a.appearance.outfitColor);
    }
    return null;
  },

  runAgent(id, input) {
    const agents = getAgents();
    const agent = agents.find(a => a.id === id);
    if (!agent) return;
    const run: RunRecord = {
      id: `run-${Date.now()}`, agentId: id, trigger: 'manual',
      status: 'running', startedAt: new Date(), finishedAt: null,
      inputSummary: input, outputSummary: null, errorSummary: null, backendRef: null,
    };
    storeUpdate(id, {
      state: 'working', zone: 'work', currentTask: input,
      lastRunAt: new Date(), lastRunStatus: 'running',
      runs: [run, ...agent.runs],
      activities: [
        { id: `act-${Date.now()}`, timestamp: new Date(), action: 'Started', detail: `Started: ${input}` },
        ...agent.activities,
      ],
    });
    // Simulate completion after 3s
    setTimeout(() => {
      const current = getAgents().find(a => a.id === id);
      if (!current) return;
      const updatedRuns = current.runs.map(r =>
        r.id === run.id ? { ...r, status: 'completed' as const, finishedAt: new Date(), outputSummary: `Completed: ${input}` } : r
      );
      storeUpdate(id, {
        state: 'idle', currentTask: null, lastRunStatus: 'completed',
        runs: updatedRuns,
        activities: [
          { id: `act-${Date.now()}`, timestamp: new Date(), action: 'Completed', detail: `Finished: ${input}` },
          ...current.activities,
        ],
      });
    }, 3000);
  },

  listSchedules() {
    return getAgents().map(toScheduleView).filter((s): s is ScheduleView => s !== null);
  },

  getTrustFindings() {
    return analyzeTrust(getAgents());
  },

  getRuntimeHealth() {
    return {
      backendConnected: false,
      gatewayReachable: false,
      localModelsAvailable: [],
      cloudProvidersConnected: ['openai', 'anthropic', 'google'].filter(p => hasProviderKey(p)),
      serviceMode: 'demo' as const,
      warnings: ['Running in demo mode — no backend connected'],
      checkedAt: new Date(),
    };
  },

  getSettings() {
    return loadSettings();
  },

  updateSettings(updates) {
    const current = loadSettings();
    saveSettings({ ...current, ...updates });
  },

  useAgents() {
    return useAgentsStore();
  },
};

// Default export for easy import
export default mockApi;
