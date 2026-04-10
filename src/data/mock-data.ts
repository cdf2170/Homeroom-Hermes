import type { Agent, MemoryItem, RuleItem, RunRecord, TrustFinding, PermissionProfile, Schedule } from "@/store/agent-store";

const now = new Date().toISOString();
const yesterday = new Date(Date.now() - 86400000).toISOString();
const twoDaysAgo = new Date(Date.now() - 172800000).toISOString();
const hourAgo = new Date(Date.now() - 3600000).toISOString();

export const MOCK_AGENTS: Agent[] = [
  {
    id: "a1000000-0000-0000-0000-000000000001",
    name: "Scout",
    purpose: "Finds relevant articles, papers, and links on topics you care about",
    archetype: "researcher",
    vibe: "cheerful",
    status: "idle",
    enabled: true,
    backgroundEnabled: false,
    runtimeMode: "local",
    smartnessLevel: "standard",
    sceneRoomId: "focus_room",
    lastRunAt: hourAgo,
    lastRunStatus: "completed",
    scheduleSummary: "Every 4 hours",
    trustPosture: "ok",
    permissionProfileId: "p1",
    createdAt: twoDaysAgo,
    updatedAt: hourAgo,
  },
  {
    id: "a1000000-0000-0000-0000-000000000002",
    name: "Pepper",
    purpose: "Manages your calendar, sends reminders, and drafts quick replies",
    archetype: "organizer",
    vibe: "calm",
    status: "working",
    enabled: true,
    backgroundEnabled: true,
    runtimeMode: "cloud",
    smartnessLevel: "advanced",
    sceneRoomId: "automation_room",
    lastRunAt: now,
    lastRunStatus: "running",
    scheduleSummary: "Twice daily",
    trustPosture: "warning",
    permissionProfileId: "p2",
    createdAt: twoDaysAgo,
    updatedAt: now,
  },
  {
    id: "a1000000-0000-0000-0000-000000000003",
    name: "Bolt",
    purpose: "Automates code reviews, generates boilerplate, and runs tests",
    archetype: "builder",
    vibe: "precise",
    status: "offline",
    enabled: false,
    backgroundEnabled: false,
    runtimeMode: "local",
    smartnessLevel: "basic",
    sceneRoomId: "local_compute_room",
    lastRunAt: yesterday,
    lastRunStatus: "failed",
    scheduleSummary: null,
    trustPosture: "critical",
    permissionProfileId: null,
    createdAt: twoDaysAgo,
    updatedAt: yesterday,
  },
  {
    id: "a1000000-0000-0000-0000-000000000004",
    name: "Miso",
    purpose: "Watches for important updates and notifies you when something needs attention",
    archetype: "watcher",
    vibe: "quiet",
    status: "sleeping",
    enabled: true,
    backgroundEnabled: true,
    runtimeMode: "hybrid",
    smartnessLevel: "standard",
    sceneRoomId: "lounge",
    lastRunAt: yesterday,
    lastRunStatus: "completed",
    scheduleSummary: "Daily",
    trustPosture: "info",
    permissionProfileId: "p4",
    createdAt: twoDaysAgo,
    updatedAt: yesterday,
  },
];

export const MOCK_MEMORY_ITEMS: MemoryItem[] = [
  { id: "m1", agentId: MOCK_AGENTS[0].id, category: "preference", content: "User prefers concise summaries over detailed reports", pinned: true, createdAt: twoDaysAgo },
  { id: "m2", agentId: MOCK_AGENTS[0].id, category: "fact", content: "User works in product design at a mid-size startup", pinned: false, createdAt: twoDaysAgo },
  { id: "m3", agentId: MOCK_AGENTS[0].id, category: "context", content: "Currently researching AI agent frameworks for an upcoming project", pinned: true, createdAt: yesterday },
  { id: "m4", agentId: MOCK_AGENTS[1].id, category: "reminder", content: "Weekly team standup is every Monday at 10am", pinned: true, createdAt: twoDaysAgo },
  { id: "m5", agentId: MOCK_AGENTS[1].id, category: "preference", content: "Calendar blocks should include a 5-minute buffer", pinned: false, createdAt: yesterday },
];

export const MOCK_RULE_ITEMS: RuleItem[] = [
  { id: "r1", agentId: MOCK_AGENTS[0].id, category: "safety", content: "Never share research results publicly without approval", enabled: true, priority: 1, createdAt: twoDaysAgo },
  { id: "r2", agentId: MOCK_AGENTS[0].id, category: "preference", content: "Prioritize sources from academic journals and established news outlets", enabled: true, priority: 2, createdAt: twoDaysAgo },
  { id: "r3", agentId: MOCK_AGENTS[1].id, category: "hard_rule", content: "Never send messages on behalf of the user without explicit approval", enabled: true, priority: 1, createdAt: twoDaysAgo },
  { id: "r4", agentId: MOCK_AGENTS[1].id, category: "safety", content: "Do not access contacts outside the user's organization", enabled: true, priority: 2, createdAt: twoDaysAgo },
  { id: "r5", agentId: MOCK_AGENTS[2].id, category: "hard_rule", content: "Never push code to production branches", enabled: true, priority: 1, createdAt: twoDaysAgo },
];

export const MOCK_RUNS: RunRecord[] = [
  { id: "run1", agentId: MOCK_AGENTS[0].id, trigger: "manual", status: "completed", startedAt: hourAgo, finishedAt: new Date(Date.now() - 3540000).toISOString(), inputSummary: "Find recent articles about local AI agent frameworks", outputSummary: "Found 8 relevant articles from the past week. Top pick: 'Building Local-First AI Agents' by TechCrunch.", errorSummary: null, durationMs: 60000, modelUsed: "llama-3.1-8b" },
  { id: "run2", agentId: MOCK_AGENTS[1].id, trigger: "schedule", status: "running", startedAt: now, finishedAt: null, inputSummary: "Check calendar for conflicts and send morning briefing", outputSummary: "", errorSummary: null, modelUsed: "gpt-4o-mini" },
  { id: "run3", agentId: MOCK_AGENTS[2].id, trigger: "manual", status: "failed", startedAt: yesterday, finishedAt: yesterday, inputSummary: "Review pull request #42", outputSummary: "", errorSummary: "Connection to local runtime lost. OpenClaw is not running.", durationMs: 2000 },
  { id: "run4", agentId: MOCK_AGENTS[3].id, trigger: "schedule", status: "completed", startedAt: yesterday, finishedAt: yesterday, inputSummary: "Check for important email updates", outputSummary: "No urgent items found. 3 newsletters archived.", errorSummary: null, durationMs: 15000, modelUsed: "llama-3.1-8b" },
  { id: "run5", agentId: MOCK_AGENTS[0].id, trigger: "schedule", status: "completed", startedAt: twoDaysAgo, finishedAt: twoDaysAgo, inputSummary: "Morning research sweep", outputSummary: "Compiled 5 new articles about prompt engineering trends.", errorSummary: null, durationMs: 45000, modelUsed: "llama-3.1-8b" },
];

export const MOCK_FINDINGS: TrustFinding[] = [
  { id: "f1", scope: "agent", targetId: MOCK_AGENTS[1].id, level: "warning", code: "BACKGROUND_NO_GATE", title: "Background mode without approval gates", detail: "Pepper runs in the background but doesn't require approval for all actions. Consider adding approval gates for sensitive operations.", recommendedAction: "Enable approval for message sending", createdAt: yesterday },
  { id: "f2", scope: "agent", targetId: MOCK_AGENTS[2].id, level: "critical", code: "RUNTIME_DISCONNECTED", title: "Local runtime not connected", detail: "Bolt is configured for local mode but OpenClaw runtime is not running. This agent cannot function until the runtime is connected.", recommendedAction: "Start OpenClaw or switch to cloud mode", createdAt: yesterday },
  { id: "f3", scope: "agent", targetId: MOCK_AGENTS[3].id, level: "info", code: "NETWORK_ACCESS_ENABLED", title: "Network access is enabled", detail: "Miso has network access enabled. This is expected for a watcher agent but worth reviewing periodically.", recommendedAction: "Review which services Miso can access", createdAt: twoDaysAgo },
  { id: "f4", scope: "global", targetId: null, level: "info", code: "NO_CLOUD_PROVIDER", title: "No cloud AI provider configured", detail: "You haven't set up a cloud AI provider yet. Agents using cloud mode will need one.", recommendedAction: "Connect OpenRouter or another provider in Connections", createdAt: twoDaysAgo },
];

export const MOCK_PERMISSIONS: PermissionProfile[] = [
  { id: "p1", agentId: MOCK_AGENTS[0].id, safetyLevel: "standard", toolScopes: ["web:read"], dataScopes: ["research"], networkAccess: true, requiresApprovalFor: ["file:write"], backgroundAllowed: false },
  { id: "p2", agentId: MOCK_AGENTS[1].id, safetyLevel: "permissive", toolScopes: ["calendar:read", "calendar:write", "email:read"], dataScopes: ["calendar", "contacts"], networkAccess: true, requiresApprovalFor: ["email:send"], backgroundAllowed: true },
  { id: "p4", agentId: MOCK_AGENTS[3].id, safetyLevel: "standard", toolScopes: ["web:read", "email:read"], dataScopes: ["notifications"], networkAccess: true, requiresApprovalFor: ["notification:send"], backgroundAllowed: true },
];

export const MOCK_SCHEDULES: Schedule[] = [
  { id: "s1", agentId: MOCK_AGENTS[0].id, enabled: true, preset: "every_4_hours", plainEnglish: "Every 4 hours", nextRunAt: new Date(Date.now() + 10800000).toISOString() },
  { id: "s2", agentId: MOCK_AGENTS[1].id, enabled: true, preset: "twice_daily", plainEnglish: "Twice daily", nextRunAt: new Date(Date.now() + 21600000).toISOString() },
  { id: "s3", agentId: MOCK_AGENTS[3].id, enabled: true, preset: "daily", plainEnglish: "Daily", nextRunAt: new Date(Date.now() + 43200000).toISOString() },
];

export const MOCK_AUDIT_EVENTS = [
  { id: "ae1", eventType: "run.completed", source: "agent", targetType: "agent", targetId: MOCK_AGENTS[0].id, targetName: "Scout", summary: "Completed research sweep", timestamp: hourAgo },
  { id: "ae2", eventType: "run.started", source: "schedule", targetType: "agent", targetId: MOCK_AGENTS[1].id, targetName: "Pepper", summary: "Started morning briefing", timestamp: now },
  { id: "ae3", eventType: "run.failed", source: "user", targetType: "agent", targetId: MOCK_AGENTS[2].id, targetName: "Bolt", summary: "Failed: runtime not connected", timestamp: yesterday },
  { id: "ae4", eventType: "agent.enabled", source: "user", targetType: "agent", targetId: MOCK_AGENTS[3].id, targetName: "Miso", summary: "Enabled by user", timestamp: twoDaysAgo },
  { id: "ae5", eventType: "run.completed", source: "schedule", targetType: "agent", targetId: MOCK_AGENTS[3].id, targetName: "Miso", summary: "Checked for updates — nothing urgent", timestamp: yesterday },
];
