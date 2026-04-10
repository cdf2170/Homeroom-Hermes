import type { Agent, AgentState, OfficeZone } from '@/types/agent';
import type {
  AgentSummaryView, AgentProfileView, RunView, ScheduleView,
  TrustFindingView, RuntimeHealthView, SettingsView,
} from '@/types/views';

// ── Homeroom API Interface ──
// All UI code calls this interface. Currently backed by mock/local store.
// Swap implementation to hit real backend when ready.

export interface HomeroomApi {
  // Agents
  listAgents(): AgentSummaryView[];
  getAgent(id: string): AgentProfileView | null;
  createAgent(agent: Agent): void;
  updateAgent(id: string, updates: Partial<Agent>): void;
  deleteAgent(id: string): void;
  setAgentState(id: string, state: AgentState, zone?: OfficeZone): void;

  // Runs
  listRuns(): RunView[];
  getRun(id: string): RunView | null;
  runAgent(id: string, input: string): void;

  // Schedules
  listSchedules(): ScheduleView[];

  // Trust
  getTrustFindings(): TrustFindingView[];

  // Runtime
  getRuntimeHealth(): RuntimeHealthView;

  // Settings
  getSettings(): SettingsView;
  updateSettings(updates: Partial<SettingsView>): void;

  // Subscriptions (for reactivity)
  useAgents(): Agent[];
}
