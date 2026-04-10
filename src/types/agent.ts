// === Core enums & types ===

export type AgentState =
  | 'working'
  | 'walking'
  | 'idle'
  | 'on-break'
  | 'waiting'
  | 'paused'
  | 'offline'
  | 'sleeping'
  | 'needs-attention';

export type OfficeZone = 'work' | 'meeting' | 'lounge' | 'quiet' | 'approval' | 'kitchen' | 'server';

export type Archetype = 'organizer' | 'researcher' | 'builder' | 'watcher' | 'helper' | 'messenger';

export type Vibe = 'calm' | 'cheerful' | 'serious' | 'precise' | 'creative' | 'quiet';

export type RuntimeMode = 'local' | 'cloud' | 'hybrid';

export type SafetyLevel = 'strict' | 'moderate' | 'autonomous';

export type RunStatus = 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';

export type SmartLevel = 'basic' | 'standard' | 'advanced';

// === Memory Item ===

export interface MemoryItem {
  id: string;
  content: string;
  category: 'preference' | 'context' | 'fact' | 'note';
  pinned: boolean;
  createdAt: Date;
}

// === Rule Item ===

export type RulePriority = 'safe' | 'preference' | 'hard-rule';

export interface RuleItem {
  id: string;
  content: string;
  priority: RulePriority;
  enabled: boolean;
  order: number;
}

// === Appearance ===

export interface AgentAppearance {
  id?: string;
  agentId?: string;
  bodyType: 'masculine' | 'feminine' | 'androgynous';
  skinTone: string;
  hairStyle: 'short' | 'long' | 'curly' | 'buzz' | 'ponytail' | 'bun' | 'mohawk' | 'braids' | 'wavy' | 'afro' | 'shaved';
  hairColor: string;
  outfitStyle: 'casual' | 'formal' | 'sporty' | 'techy' | 'creative' | 'cozy';
  outfitColor: string;
  accentColor: string;
  shoeColor: string;
  outfitPattern: 'solid' | 'striped' | 'dotted' | 'plaid';
  facialHair: 'none' | 'stubble' | 'beard' | 'mustache' | 'goatee';
  headwear: 'none' | 'cap' | 'beanie' | 'headband' | 'beret';
  glasses: 'none' | 'round' | 'square' | 'aviator';
  accessories: ('none' | 'headphones' | 'scarf' | 'watch' | 'necklace' | 'earbuds')[];
  badge: string;
  voicePreset: 'neutral' | 'warm' | 'direct' | 'playful' | 'calm';
  spriteConfig?: Record<string, unknown>;
}

// === Permission Profile ===

export interface PermissionProfile {
  id: string;
  agentId: string;
  safetyLevel: SafetyLevel;
  toolScopes: string[];
  dataScopes: string[];
  networkAccess: boolean;
  requiresApprovalFor: string[];
  backgroundAllowed: boolean;
}

// === Run Record ===

export interface RunRecord {
  id: string;
  agentId: string;
  trigger: 'manual' | 'schedule' | 'event';
  status: RunStatus;
  startedAt: Date;
  finishedAt: Date | null;
  inputSummary: string;
  outputSummary: string | null;
  errorSummary: string | null;
  backendRef: string | null;
}

// === Schedule ===

export interface Schedule {
  id: string;
  agentId: string;
  enabled: boolean;
  preset: 'hourly' | 'daily' | 'weekly' | 'custom' | null;
  plainEnglish: string;
  backendExpression: string | null;
  nextRunAt: Date | null;
}

// === Audit Event ===

export interface AuditEvent {
  id: string;
  actor: string;
  sourceMode: 'user' | 'agent' | 'system' | 'schedule';
  eventType: string;
  targetType: 'agent' | 'run' | 'schedule' | 'permission' | 'system';
  targetId: string;
  timestamp: Date;
  summary: string;
  permissionContext: string | null;
  runId: string | null;
}

// === Activity (lightweight) ===

export interface AgentActivity {
  id: string;
  timestamp: Date;
  action: string;
  detail: string;
}

// === Agent ===

export type CheckInFrequency = 'never' | 'hourly' | 'daily' | 'after-each-task' | 'when-stuck';
export type EscalationBehavior = 'pause-and-wait' | 'retry-once' | 'notify-and-continue' | 'ask-for-help';
export type TaskStyle = 'step-by-step' | 'autonomous' | 'collaborative';

export interface Agent {
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
  // OpenClaw doc mapping fields
  audienceNotes: string;    // Maps to USER.md
  environmentNotes: string; // Maps to TOOLS.md
  memoryNotes: string;      // Maps to MEMORY.md
  // Structured memory & rules
  memoryItems: MemoryItem[];
  ruleItems: RuleItem[];
}

// === Agent Template ===

export interface AgentTemplatePrefill {
  role: string;
  purpose: string;
  personality: string;
  instructions: string;
  archetype: Archetype;
  vibe: Vibe;
  smartnessLevel: SmartLevel;
  runtimeMode: RuntimeMode;
  zone: OfficeZone;
  requiresApproval: boolean;
  backgroundEnabled: boolean;
  backgroundBehavior: string;
  appearance: Partial<AgentAppearance>;
}

export interface AgentTemplate {
  id: string;
  name: string;
  role: string;
  personality: string;
  description: string;
  icon: string;
  archetype: Archetype;
  vibe: Vibe;
  defaultAppearance: Partial<AgentAppearance>;
  summary: string;
  helpsWith: string;
  exampleTasks: string[];
  idealFor: string;
  suggestedTone: string;
  outputStyle: string;
  prefill: AgentTemplatePrefill;
}

// === Backend Health (internal — never shown raw to users) ===

export interface RuntimeHealth {
  backendConnected: boolean;
  gatewayReachable: boolean;
  schedulerReachable: boolean;
  modelsAvailable: string[];
  serviceMode: 'local' | 'always-on';
  warnings: string[];
  checkedAt: Date;
}

// === Room bounds for agent containment ===

export interface RoomBounds {
  x: number;
  y: number;
  width: number;
  height: number;
  label: string;
}

// Each room has pixel bounds agents MUST stay inside
export const ROOM_BOUNDS: Record<OfficeZone, RoomBounds> = {
  work:     { x: 30, y: 40, width: 280, height: 200, label: 'WORK AREA' },
  meeting:  { x: 440, y: 40, width: 220, height: 200, label: 'MEETING ROOM' },
  approval: { x: 320, y: 260, width: 120, height: 100, label: 'HELP DESK' },
  kitchen:  { x: 680, y: 40, width: 180, height: 200, label: 'KITCHEN' },
  lounge:   { x: 440, y: 380, width: 220, height: 170, label: 'LOUNGE' },
  quiet:    { x: 30, y: 380, width: 260, height: 170, label: 'QUIET CORNER' },
  server:   { x: 680, y: 380, width: 180, height: 170, label: 'SERVER ROOM' },
};

export const STATE_TO_ZONE: Record<AgentState, OfficeZone> = {
  working: 'work',
  walking: 'work',
  idle: 'work',
  'on-break': 'lounge',
  waiting: 'approval',
  paused: 'work',
  offline: 'quiet',
  sleeping: 'quiet',
  'needs-attention': 'approval',
};

export const STATE_LABELS: Record<AgentState, string> = {
  working: 'Working',
  walking: 'Walking',
  idle: 'Idle',
  'on-break': 'On Break',
  waiting: 'Waiting for You',
  paused: 'Paused',
  offline: 'Offline',
  sleeping: 'Sleeping',
  'needs-attention': 'Needs Attention',
};

export const ARCHETYPE_LABELS: Record<Archetype, string> = {
  organizer: 'Organizer',
  researcher: 'Researcher',
  builder: 'Builder',
  watcher: 'Watcher',
  helper: 'Helper',
  messenger: 'Messenger',
};

export const VIBE_LABELS: Record<Vibe, string> = {
  calm: 'Calm',
  cheerful: 'Cheerful',
  serious: 'Serious',
  precise: 'Precise',
  creative: 'Creative',
  quiet: 'Quiet',
};

export const DEFAULT_APPEARANCE: AgentAppearance = {
  bodyType: 'androgynous',
  skinTone: '#FDDBB4',
  hairStyle: 'short',
  hairColor: '#3B2716',
  outfitStyle: 'casual',
  outfitColor: '#5B8C5A',
  accentColor: '#E67E22',
  shoeColor: '#4A4A4A',
  outfitPattern: 'solid',
  facialHair: 'none',
  headwear: 'none',
  glasses: 'none',
  accessories: ['none'],
  badge: '',
  voicePreset: 'neutral',
};

// Kept for backward compat but use ROOM_BOUNDS for positioning
export const ZONE_POSITIONS: Record<OfficeZone, { x: number; y: number }> = {
  work: { x: 170, y: 140 },
  meeting: { x: 550, y: 140 },
  lounge: { x: 550, y: 465 },
  quiet: { x: 160, y: 465 },
  approval: { x: 380, y: 310 },
  kitchen: { x: 770, y: 140 },
  server: { x: 770, y: 465 },
};
