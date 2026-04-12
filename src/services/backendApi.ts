/**
 * backendApi.ts
 *
 * Thin HTTP client for the Homeroom backend service (Fastify on :5174).
 *
 * How this fits in:
 *   Lovable UI → stores (agentStore, etc.)
 *                  ↑ hydrated by
 *              backendApi (this file)
 *                  ↑ calls
 *              Homeroom Service on 127.0.0.1:5174
 *
 * Every function here is async — it makes a real HTTP request.
 * The stores stay synchronous for the UI; they're populated once on boot
 * and updated optimistically on mutations.
 */

import type { AgentSummaryView, AgentProfileView, RuntimeHealthView, SettingsView } from '@/types/views';
import type { AgentState, OfficeZone } from '@/types/agent';

const BASE = 'http://127.0.0.1:5174';

// ── helpers ──────────────────────────────────────────────────────────────────

async function get<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE}${path}`);
  if (!res.ok) throw new Error(`GET ${path} → ${res.status}`);
  return res.json();
}

async function post<T>(path: string, body?: unknown): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) throw new Error(`POST ${path} → ${res.status}`);
  return res.json();
}

async function patch<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`PATCH ${path} → ${res.status}`);
  return res.json();
}

async function del(path: string): Promise<void> {
  const res = await fetch(`${BASE}${path}`, { method: 'DELETE' });
  if (!res.ok) throw new Error(`DELETE ${path} → ${res.status}`);
}

// ── Shape of what the backend actually returns ────────────────────────────────
// (different from the frontend's view types — we map below)

interface BackendAgent {
  id: string;
  name: string;
  purpose: string;
  archetype: string;
  vibe: string;
  status: string;           // "offline" | "idle" | "working" | etc.
  enabled: boolean;
  backgroundEnabled: boolean;
  runtimeMode: string;
  smartnessLevel: string;
  sceneRoomId: string;      // "focus_room" | "lounge" | etc.
  lastRunAt: string | null;
  lastRunStatus: string | null;
  scheduleSummary: string | null;
  trustPosture: string;
  modelRef: string | null;
}

interface BackendHealth {
  openclawInstalled: boolean;
  gatewayReachable: boolean;
  schedulerReachable: boolean;
  modelsAvailable: string[];
  homeroomServiceMode: string;
  warnings: string[];
  checkedAt: string;
}

interface BackendSettings {
  defaultRuntimeMode: string;
  defaultSmartLevel: string;
  defaultSafetyLevel: string;
  providers: { id: string; label: string; connected: boolean }[];
}

// ── Mappers ───────────────────────────────────────────────────────────────────
// Translate backend snake_case/different-naming into the frontend view types.

const ZONE_MAP: Record<string, OfficeZone> = {
  focus_room: 'work',
  lounge:     'lounge',
  meeting:    'meeting',
  kitchen:    'kitchen',
  server:     'server',
  quiet:      'quiet',
};

const STATUS_MAP: Record<string, AgentState> = {
  offline:         'offline',
  idle:            'idle',
  working:         'working',
  sleeping:        'sleeping',
  paused:          'paused',
  'on-break':      'on-break',
  waiting:         'waiting',
  'needs-attention': 'needs-attention',
};

// Generate a deterministic colour from a string (used for agent avatars).
function colorFromString(s: string): string {
  const palette = [
    '#6366f1', '#8b5cf6', '#ec4899', '#f59e0b',
    '#10b981', '#3b82f6', '#ef4444', '#14b8a6',
  ];
  let hash = 0;
  for (let i = 0; i < s.length; i++) hash = s.charCodeAt(i) + ((hash << 5) - hash);
  return palette[Math.abs(hash) % palette.length];
}

function mapAgent(a: BackendAgent): AgentSummaryView {
  return {
    id:                 a.id,
    name:               a.name,
    role:               a.purpose,   // backend has no separate "role" field yet
    purpose:            a.purpose,
    state:              STATUS_MAP[a.status] ?? 'offline',
    zone:               ZONE_MAP[a.sceneRoomId] ?? 'work',
    runtimeMode:        a.runtimeMode as AgentSummaryView['runtimeMode'],
    smartnessLevel:     a.smartnessLevel as AgentSummaryView['smartnessLevel'],
    enabled:            a.enabled,
    backgroundEnabled:  a.backgroundEnabled,
    currentTask:        null,
    lastRunAt:          a.lastRunAt ? new Date(a.lastRunAt) : null,
    lastRunStatus:      a.lastRunStatus as AgentSummaryView['lastRunStatus'],
    scheduleSummary:    a.scheduleSummary,
    outfitColor:        colorFromString(a.id),
    initial:            a.name.charAt(0).toUpperCase(),
    runCount:           0,
    needsAttention:     a.trustPosture === 'critical' || a.trustPosture === 'warning',
    hasPermissions:     true,
    modelRef:           a.modelRef ?? null,
  };
}

function mapHealth(h: BackendHealth): RuntimeHealthView {
  return {
    backendConnected:        true,
    gatewayReachable:        h.gatewayReachable,
    localModelsAvailable:    h.modelsAvailable,
    cloudProvidersConnected: [],
    serviceMode:             h.homeroomServiceMode as RuntimeHealthView['serviceMode'],
    warnings:                h.warnings,
    checkedAt:               new Date(h.checkedAt),
  };
}

function mapSettings(s: BackendSettings & Record<string, unknown>): Partial<SettingsView> {
  return {
    defaultRuntime:           s.defaultRuntimeMode as SettingsView['defaultRuntime'],
    requireApprovalByDefault: (s.requireApprovalByDefault as boolean) ?? false,
    backgroundOffByDefault:   (s.backgroundOffByDefault as boolean) ?? false,
    ambientAnimations:        (s.ambientAnimations as boolean) ?? true,
    agentIdleAnimations:      (s.agentIdleAnimations as boolean) ?? true,
    notifyOnAttention:        (s.notifyOnAttention as boolean) ?? true,
    notifyOnComplete:         (s.notifyOnComplete as boolean) ?? true,
  };
}

// ── Backend detail/run shapes ─────────────────────────────────────────────────

interface BackendDetailAgent extends BackendAgent {
  role: string;
  instructions: string;
  audienceNotes: string;
  environmentNotes: string;
  memoryNotes: string;
  checkInFrequency: string;
  escalationBehavior: string;
  taskStyle: string;
  notifyOnComplete: boolean;
  notifyOnError: boolean;
  memoryItems: { id: string; content: string; category: string; pinned: boolean }[];
  ruleItems: { id: string; content: string; priority: number; enabled: boolean }[];
  permissionProfile: {
    safetyLevel: string;
    networkAccess: boolean;
    networkAccessMode: string;
    requiresApprovalFor: string[];
    backgroundAllowed: boolean;
    toolScopes: string[];
    dataScopes: string[];
  } | null;
  schedule: { enabled: boolean; preset: string; plainEnglish: string; backendExpression: string | null; nextRunAt: string | null } | null;
  runtime: { backendRef: string | null; workspacePath: string | null } | null;
  trustFindings: { id: string; level: string; code: string; title: string; detail: string }[];
  createdAt: string;
  updatedAt: string;
}

export interface BackendRun {
  id: string;
  agentId: string;
  trigger: string;
  status: string;
  startedAt: string;
  finishedAt: string | null;
  inputSummary: string;
  outputSummary: string;
  errorSummary: string | null;
}

function mapAgentDetail(a: BackendDetailAgent): AgentProfileView {
  const base = mapAgent(a);
  return {
    ...base,
    role:               a.role ?? '',
    personality:        a.instructions ?? '',
    instructions:       a.instructions ?? '',
    audienceNotes:      a.audienceNotes ?? '',
    environmentNotes:   a.environmentNotes ?? '',
    memoryNotes:        a.memoryNotes ?? '',
    checkInFrequency:   (a.checkInFrequency as AgentProfileView['checkInFrequency']) ?? 'daily',
    escalationBehavior: (a.escalationBehavior as AgentProfileView['escalationBehavior']) ?? 'notify',
    taskStyle:          (a.taskStyle as AgentProfileView['taskStyle']) ?? 'balanced',
    notifyOnComplete:   a.notifyOnComplete ?? true,
    notifyOnError:      a.notifyOnError ?? true,
    appearance:         { bodyType: 'masculine', skinTone: '#F5CBA7', hairStyle: 'short', hairColor: '#4A4A4A', outfitStyle: 'casual', outfitColor: base.outfitColor } as any,
    defaultRoom:        base.zone,
    permissionProfileId: a.permissionProfile ? 'persisted' : null,
    activities:         [],
    runs:               [],
    permissions:        a.permissionProfile ? {
      id:                  'persisted',
      agentId:             a.id,
      safetyLevel:         a.permissionProfile.safetyLevel as any,
      toolScopes:          a.permissionProfile.toolScopes ?? [],
      dataScopes:          a.permissionProfile.dataScopes ?? [],
      networkAccess:       a.permissionProfile.networkAccess,
      requiresApprovalFor: a.permissionProfile.requiresApprovalFor,
      backgroundAllowed:   a.permissionProfile.backgroundAllowed,
    } : null,
    schedule:     a.schedule ? {
      id:               'persisted',
      agentId:          a.id,
      enabled:          a.schedule.enabled,
      preset:           a.schedule.preset as any,
      plainEnglish:     a.schedule.plainEnglish,
      backendExpression: a.schedule.backendExpression,
      timezone:         'UTC',
      nextRunAt:        a.schedule.nextRunAt ? new Date(a.schedule.nextRunAt) : null,
    } : null,
    memoryItems:   (a.memoryItems ?? []).map(m => ({ id: m.id, agentId: a.id, content: m.content, category: m.category as any, pinned: m.pinned, createdAt: new Date(), updatedAt: new Date() })),
    ruleItems:     (a.ruleItems ?? []).map(r => ({ id: r.id, agentId: a.id, content: r.content, priority: r.priority as any, enabled: r.enabled, createdAt: new Date(), updatedAt: new Date() })),
  };
}

// ── Public API ────────────────────────────────────────────────────────────────

export const backendApi = {
  /** Check if the backend service is reachable at all. */
  async ping(): Promise<boolean> {
    try {
      const res = await fetch(`${BASE}/`, { signal: AbortSignal.timeout(2000) });
      return res.ok;
    } catch {
      return false;
    }
  },

  /** Fetch all agents and map to frontend view types. */
  async listAgents(): Promise<AgentSummaryView[]> {
    const raw = await get<BackendAgent[]>('/api/agents');
    return raw.map(mapAgent);
  },

  /** Fetch runtime health status. */
  async getHealth(): Promise<RuntimeHealthView> {
    const raw = await get<BackendHealth>('/api/runtime/health');
    return mapHealth(raw);
  },

  /** Fetch settings. */
  async getSettings(): Promise<Partial<SettingsView>> {
    const raw = await get<BackendSettings>('/api/settings');
    return mapSettings(raw);
  },

  /** Create an agent. */
  async createAgent(payload: { name: string; purpose: string; archetype: string }) {
    return post<BackendAgent>('/api/agents', payload);
  },

  /** Update agent fields. */
  async updateAgent(id: string, updates: Record<string, unknown>) {
    return patch<BackendAgent>(`/api/agents/${id}`, updates);
  },

  /** Delete an agent. */
  async deleteAgent(id: string) {
    return del(`/api/agents/${id}`);
  },

  /** Trigger a manual run. */
  async runAgent(id: string, input: string) {
    return post<BackendRun>(`/api/agents/${id}/run`, { input });
  },

  /** Fetch full agent detail (profile + permissions + schedule + memory + rules). */
  async getAgent(id: string): Promise<AgentProfileView> {
    const raw = await get<BackendDetailAgent>(`/api/agents/${id}`);
    return mapAgentDetail(raw);
  },

  /** List runs for an agent. */
  async listRuns(agentId: string): Promise<BackendRun[]> {
    return get<BackendRun[]>(`/api/agents/${agentId}/runs`);
  },

  /** List audit events for an agent. */
  async listActivity(agentId: string): Promise<{ id: string; eventType: string; summary: string; timestamp: string; actor: string }[]> {
    return get(`/api/agents/${agentId}/activity`);
  },

  /** Fetch global audit log. */
  async listAudit(limit = 100): Promise<{ id: string; eventType: string; summary: string; timestamp: string; actor: string; sourceMode: string; targetType: string; targetId: string; runId: string | null }[]> {
    return get(`/api/audit?limit=${limit}`);
  },

  /** Fetch all runs across all agents. */
  async listAllRuns(limit = 100): Promise<BackendRun[]> {
    return get<BackendRun[]>(`/api/runs?limit=${limit}`);
  },

  /** Update settings — only sends fields the backend schema accepts. */
  async updateSettings(updates: Partial<SettingsView>): Promise<Partial<SettingsView>> {
    const body: Record<string, unknown> = {};
    if (updates.defaultRuntime !== undefined) body.defaultRuntimeMode = updates.defaultRuntime;
    // Other UI preferences are stored in localStorage via uiPrefsStore, not here.
    const raw = await patch<BackendSettings & Record<string, unknown>>('/api/settings', body);
    return mapSettings(raw);
  },

  /** Fetch trust findings across all agents. */
  async listTrustFindings(): Promise<{ id: string; agentId: string; level: string; code: string; title: string; detail: string; resolvedAt: string | null }[]> {
    const raw = await get<{ findings: { id: string; agentId: string; level: string; code: string; title: string; detail: string; resolvedAt: string | null }[] }>('/api/trust/findings');
    return raw.findings ?? [];
  },

  /** Store an API key for a provider. */
  async setCredential(provider: string, key: string): Promise<{ ok: boolean; masked: string }> {
    return post(`/api/credentials/${provider}`, { key });
  },

  /** Delete a stored credential. */
  async deleteCredential(provider: string): Promise<void> {
    return del(`/api/credentials/${provider}`);
  },

  /** List all stored credentials (masked). */
  async listCredentials(): Promise<{ provider: string; masked: string; updatedAt: string }[]> {
    return get('/api/credentials');
  },
};
