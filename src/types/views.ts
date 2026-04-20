import type {
  AgentState, OfficeZone, Archetype, Vibe, RuntimeMode, SafetyLevel,
  SmartLevel, RunStatus, AgentAppearance, PermissionProfile, Schedule,
  AgentActivity, RunRecord, MemoryItem, RuleItem,
  CheckInFrequency, EscalationBehavior, TaskStyle,
} from './agent';

// ── List-level view (cards, sidebar, dashboard) ──

export interface AgentSummaryView {
  id: string;
  name: string;
  role: string;
  purpose: string;
  state: AgentState;
  zone: OfficeZone;
  runtimeMode: RuntimeMode;
  smartnessLevel: SmartLevel;
  enabled: boolean;
  backgroundEnabled: boolean;
  currentTask: string | null;
  lastRunAt: Date | null;
  lastRunStatus: RunStatus | null;
  scheduleSummary: string | null;
  outfitColor: string;
  initial: string;
  runCount: number;
  needsAttention: boolean;
  hasPermissions: boolean;
  modelRef: string | null;
}

// ── Full profile view ──

export interface AgentProfileView {
  id: string;
  name: string;
  role: string;
  purpose: string;
  archetype: Archetype;
  vibe: Vibe;
  personality: string;
  instructions: string;
  smartnessLevel: SmartLevel;
  runtimeMode: RuntimeMode;
  enabled: boolean;
  backgroundEnabled: boolean;
  state: AgentState;
  zone: OfficeZone;
  defaultRoom: OfficeZone;
  appearance: AgentAppearance;
  currentTask: string | null;
  lastRunAt: Date | null;
  lastRunStatus: RunStatus | null;
  permissionProfileId: string | null;
  scheduleSummary: string | null;
  checkInFrequency: CheckInFrequency;
  escalationBehavior: EscalationBehavior;
  taskStyle: TaskStyle;
  notifyOnComplete: boolean;
  notifyOnError: boolean;
  activities: AgentActivity[];
  runs: RunRecord[];
  permissions: PermissionProfile | null;
  schedule: Schedule | null;
  audienceNotes: string;
  environmentNotes: string;
  memoryNotes: string;
  memoryItems: MemoryItem[];
  ruleItems: RuleItem[];
}

// ── Run detail view ──

export interface RunView {
  id: string;
  agentId: string;
  agentName: string;
  agentColor: string;
  trigger: 'manual' | 'schedule' | 'event';
  status: RunStatus;
  startedAt: Date;
  finishedAt: Date | null;
  durationMs: number | null;
  inputSummary: string;
  outputSummary: string | null;
  errorSummary: string | null;
  backendRef: string | null;
  // future: modelUsed, redacted
}

// ── Schedule view ──

export interface ScheduleView {
  id: string;
  agentId: string;
  agentName: string;
  enabled: boolean;
  preset: string | null;
  plainEnglish: string;
  backendExpression: string | null;
  nextRunAt: Date | null;
  timezone: string;
}

// ── Trust finding ──

export type FindingSeverity = 'ok' | 'informational' | 'review' | 'risky';

export interface TrustFindingView {
  id: string;
  severity: FindingSeverity;
  title: string;
  detail: string;
  agentId?: string;
  agentName?: string;
}

// ── Runtime health ──

export interface RuntimeHealthView {
  backendConnected: boolean;
  gatewayReachable: boolean;
  localModelsAvailable: string[];
  cloudProvidersConnected: string[];
  serviceMode: 'local' | 'always-on';
  warnings: string[];
  checkedAt: Date;
}

// ── Settings ──

export interface SettingsView {
  displayName: string;
  serviceMode: 'local' | 'always-on';
  defaultRuntime: RuntimeMode;
  requireApprovalByDefault: boolean;
  backgroundOffByDefault: boolean;
  ambientAnimations: boolean;
  agentIdleAnimations: boolean;
  notifyOnAttention: boolean;
  notifyOnComplete: boolean;
}
