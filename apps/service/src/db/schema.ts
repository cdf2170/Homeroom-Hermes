import { sqliteTable, text, integer, index } from "drizzle-orm/sqlite-core";

// ─── Agents ─────────────────────────────────────────────────────────────────

export const agents = sqliteTable("agents", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  purpose: text("purpose").notNull().default(""),
  archetype: text("archetype").notNull().default("helper"),
  vibe: text("vibe").notNull().default("calm"),
  smartnessLevel: text("smartness_level").notNull().default("standard"),
  runtimeMode: text("runtime_mode").notNull().default("local"),
  runtimePreference: text("runtime_preference"),
  enabled: integer("enabled", { mode: "boolean" }).notNull().default(false),
  backgroundEnabled: integer("background_enabled", { mode: "boolean" }).notNull().default(false),
  status: text("status").notNull().default("offline"),
  sceneRoomId: text("scene_room_id").notNull().default("focus_room"),
  sceneState: text("scene_state").notNull().default("idle"),
  lastRunAt: text("last_run_at"),
  lastRunStatus: text("last_run_status"),
  scheduleSummary: text("schedule_summary"),
  permissionProfileId: text("permission_profile_id"),
  appearanceId: text("appearance_id"),
  /** JSON-serialized AgentAppearance object */
  appearance: text("appearance"),

  // Extended profile fields
  role: text("role").notNull().default(""),
  instructions: text("instructions").notNull().default(""),
  audienceNotes: text("audience_notes").notNull().default(""),
  environmentNotes: text("environment_notes").notNull().default(""),
  memoryNotes: text("memory_notes").notNull().default(""),
  checkInFrequency: text("check_in_frequency").notNull().default("on_completion"),
  escalationBehavior: text("escalation_behavior").notNull().default("ask"),
  taskStyle: text("task_style").notNull().default("methodical"),
  notifyOnComplete: integer("notify_on_complete", { mode: "boolean" }).notNull().default(true),
  notifyOnError: integer("notify_on_error", { mode: "boolean" }).notNull().default(true),

  // Model selection — e.g. "anthropic/claude-3.5-sonnet", "openai/gpt-4o"
  modelRef: text("model_ref"),

  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
});

// ─── Memory Items ────────────────────────────────────────────────────────────

export const memoryItems = sqliteTable(
  "memory_items",
  {
    id: text("id").primaryKey(),
    agentId: text("agent_id").notNull(),
    content: text("content").notNull(),
    category: text("category").notNull().default("fact"),
    pinned: integer("pinned", { mode: "boolean" }).notNull().default(false),
    createdAt: text("created_at").notNull(),
    updatedAt: text("updated_at").notNull(),
  },
  (t) => [index("memory_items_agent_id_idx").on(t.agentId)],
);

// ─── Rule Items ──────────────────────────────────────────────────────────────

export const ruleItems = sqliteTable(
  "rule_items",
  {
    id: text("id").primaryKey(),
    agentId: text("agent_id").notNull(),
    content: text("content").notNull(),
    priority: integer("priority").notNull().default(50),
    enabled: integer("enabled", { mode: "boolean" }).notNull().default(true),
    createdAt: text("created_at").notNull(),
    updatedAt: text("updated_at").notNull(),
  },
  (t) => [index("rule_items_agent_id_idx").on(t.agentId)],
);

// ─── Permission Profiles ─────────────────────────────────────────────────────

export const permissionProfiles = sqliteTable("permission_profiles", {
  id: text("id").primaryKey(),
  agentId: text("agent_id").notNull().unique(),
  safetyLevel: text("safety_level").notNull().default("strict"),
  toolScopes: text("tool_scopes").notNull().default("[]"), // JSON array
  dataScopes: text("data_scopes").notNull().default("[]"), // JSON array
  networkAccess: integer("network_access", { mode: "boolean" }).notNull().default(false),
  networkAccessMode: text("network_access_mode").notNull().default("none"), // none | restricted | open
  requiresApprovalFor: text("requires_approval_for")
    .notNull()
    .default('["file:write","shell:exec"]'), // JSON array
  backgroundAllowed: integer("background_allowed", { mode: "boolean" }).notNull().default(false),
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
});

// ─── Schedules ───────────────────────────────────────────────────────────────

export const schedules = sqliteTable("schedules", {
  id: text("id").primaryKey(),
  agentId: text("agent_id").notNull().unique(),
  enabled: integer("enabled", { mode: "boolean" }).notNull().default(false),
  preset: text("preset").notNull().default("manual_only"),
  plainEnglish: text("plain_english").notNull().default("Manual only"),
  backendExpression: text("backend_expression"),
  timezone: text("timezone").notNull().default("UTC"),
  nextRunAt: text("next_run_at"),
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
});

// ─── Runtime Projections ─────────────────────────────────────────────────────

export const runtimeProjections = sqliteTable("runtime_projections", {
  agentId: text("agent_id").primaryKey(),
  backendRef: text("backend_ref"),
  modelRef: text("model_ref"),
  providerRef: text("provider_ref"),
  state: text("state").notNull().default("unknown"),
  currentRunId: text("current_run_id"),
  schedulerState: text("scheduler_state").notNull().default("inactive"),
  workspacePath: text("workspace_path"),
  lastSyncedAt: text("last_synced_at"),
});

// ─── Runs ────────────────────────────────────────────────────────────────────

export const runs = sqliteTable(
  "runs",
  {
    id: text("id").primaryKey(),
    agentId: text("agent_id").notNull(),
    trigger: text("trigger").notNull().default("manual"),
    status: text("status").notNull().default("pending"),
    startedAt: text("started_at").notNull(),
    finishedAt: text("finished_at"),
    inputSummary: text("input_summary").notNull().default(""),
    outputSummary: text("output_summary").notNull().default(""),
    errorSummary: text("error_summary"),
    backendRef: text("backend_ref"), // adapter run ref for polling
  },
  (t) => [
    index("runs_agent_id_idx").on(t.agentId),
    index("runs_started_at_idx").on(t.startedAt),
  ],
);

// ─── Trust Findings ──────────────────────────────────────────────────────────

export const trustFindings = sqliteTable(
  "trust_findings",
  {
    id: text("id").primaryKey(),
    scope: text("scope").notNull().default("agent"),
    targetId: text("target_id"),
    level: text("level").notNull().default("ok"),
    code: text("code").notNull(),
    title: text("title").notNull(),
    detail: text("detail").notNull().default(""),
    recommendedAction: text("recommended_action").notNull().default(""),
    createdAt: text("created_at").notNull(),
  },
  (t) => [
    index("trust_findings_scope_target_idx").on(t.scope, t.targetId),
  ],
);

// ─── Audit Events ─────────────────────────────────────────────────────────────

export const auditEvents = sqliteTable(
  "audit_events",
  {
    id: text("id").primaryKey(),
    actor: text("actor").notNull().default("user"),
    sourceMode: text("source_mode").notNull().default("user"),
    eventType: text("event_type").notNull(),
    targetType: text("target_type").notNull(),
    targetId: text("target_id").notNull(),
    timestamp: text("timestamp").notNull(),
    summary: text("summary").notNull().default(""),
    permissionContext: text("permission_context"), // JSON or null
    runId: text("run_id"),
  },
  (t) => [
    index("audit_events_target_idx").on(t.targetType, t.targetId),
    index("audit_events_timestamp_idx").on(t.timestamp),
  ],
);

// ─── Settings ─────────────────────────────────────────────────────────────────

export const settings = sqliteTable("settings", {
  id: text("id").primaryKey().default("singleton"),
  defaultRuntimeMode: text("default_runtime_mode").notNull().default("local"),
  defaultSmartLevel: text("default_smart_level").notNull().default("standard"),
  defaultSafetyLevel: text("default_safety_level").notNull().default("strict"),
  openclawWorkspacePath: text("openclaw_workspace_path").notNull().default(""),
  // Provider keys stored as JSON: { [providerId]: { maskedKey, lastVerifiedAt } }
  // Full keys are NEVER stored here in plaintext — TODO(phase-5): keychain bridge
  providerMeta: text("provider_meta").notNull().default("{}"),
  updatedAt: text("updated_at").notNull(),
});
