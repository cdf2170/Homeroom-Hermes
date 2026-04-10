import { create } from "zustand";

export interface Agent {
  id: string;
  name: string;
  purpose: string;
  archetype: string;
  vibe: string;
  status: string;
  enabled: boolean;
  backgroundEnabled: boolean;
  runtimeMode: string;
  smartnessLevel: string;
  sceneRoomId: string;
  lastRunAt: string | null;
  lastRunStatus: string | null;
  scheduleSummary: string | null;
  trustPosture: string;
  permissionProfileId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface MemoryItem {
  id: string;
  agentId: string;
  category: "preference" | "fact" | "context" | "reminder";
  content: string;
  pinned: boolean;
  createdAt: string;
}

export interface RuleItem {
  id: string;
  agentId: string;
  category: "safety" | "preference" | "hard_rule";
  content: string;
  enabled: boolean;
  priority: number;
  createdAt: string;
}

export interface RunRecord {
  id: string;
  agentId: string;
  trigger: string;
  status: string;
  startedAt: string;
  finishedAt: string | null;
  inputSummary: string;
  outputSummary: string;
  errorSummary: string | null;
  durationMs?: number;
  modelUsed?: string;
}

export interface TrustFinding {
  id: string;
  scope: string;
  targetId: string | null;
  level: string;
  code: string;
  title: string;
  detail: string;
  recommendedAction: string;
  createdAt: string;
}

export interface PermissionProfile {
  id: string;
  agentId: string;
  safetyLevel: string;
  toolScopes: string[];
  dataScopes: string[];
  networkAccess: boolean;
  requiresApprovalFor: string[];
  backgroundAllowed: boolean;
}

export interface Schedule {
  id: string;
  agentId: string;
  enabled: boolean;
  preset: string;
  plainEnglish: string;
  nextRunAt: string | null;
}

interface AgentStore {
  agents: Agent[];
  selectedAgentId: string | null;
  setAgents: (agents: Agent[]) => void;
  addAgent: (agent: Agent) => void;
  updateAgent: (id: string, data: Partial<Agent>) => void;
  removeAgent: (id: string) => void;
  selectAgent: (id: string | null) => void;
  getAgent: (id: string) => Agent | undefined;
}

export const useAgentStore = create<AgentStore>((set, get) => ({
  agents: [],
  selectedAgentId: null,
  setAgents: (agents) => set({ agents }),
  addAgent: (agent) => set((s) => ({ agents: [...s.agents, agent] })),
  updateAgent: (id, data) =>
    set((s) => ({
      agents: s.agents.map((a) => (a.id === id ? { ...a, ...data } : a)),
    })),
  removeAgent: (id) => set((s) => ({ agents: s.agents.filter((a) => a.id !== id) })),
  selectAgent: (id) => set({ selectedAgentId: id }),
  getAgent: (id) => get().agents.find((a) => a.id === id),
}));
