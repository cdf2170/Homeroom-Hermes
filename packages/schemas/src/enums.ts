import { z } from "zod";

// --- Agent state & behavior ---

export const AgentStatus = z.enum([
  "working",
  "walking",
  "idle",
  "on_break",
  "waiting_for_you",
  "paused",
  "offline",
  "sleeping",
  "needs_attention",
]);
export type AgentStatus = z.infer<typeof AgentStatus>;

export const RoomId = z.enum([
  "focus_room",
  "break_room",
  "help_desk",
  "automation_room",
  "local_compute_room",
  "cloud_room",
  "lounge",
]);
export type RoomId = z.infer<typeof RoomId>;

export const Archetype = z.enum([
  "organizer",
  "researcher",
  "builder",
  "watcher",
  "helper",
  "messenger",
]);
export type Archetype = z.infer<typeof Archetype>;

export const Vibe = z.enum(["calm", "cheerful", "serious", "precise", "creative", "quiet"]);
export type Vibe = z.infer<typeof Vibe>;

export const RuntimeMode = z.enum(["local", "cloud", "hybrid"]);
export type RuntimeMode = z.infer<typeof RuntimeMode>;

export const SmartLevel = z.enum(["basic", "standard", "advanced"]);
export type SmartLevel = z.infer<typeof SmartLevel>;

// --- Permissions ---

export const SafetyLevel = z.enum(["strict", "standard", "permissive"]);
export type SafetyLevel = z.infer<typeof SafetyLevel>;

// --- Runs ---

export const RunTrigger = z.enum(["manual", "schedule", "event", "background"]);
export type RunTrigger = z.infer<typeof RunTrigger>;

export const RunStatus = z.enum(["pending", "running", "completed", "failed", "cancelled"]);
export type RunStatus = z.infer<typeof RunStatus>;

// --- Audit ---

export const SourceMode = z.enum(["user", "agent", "system", "schedule"]);
export type SourceMode = z.infer<typeof SourceMode>;

export const AuditEventType = z.enum([
  "agent.created",
  "agent.updated",
  "agent.deleted",
  "agent.enabled",
  "agent.disabled",
  "run.started",
  "run.completed",
  "run.failed",
  "permission.changed",
  "schedule.changed",
  "runtime.mode_changed",
  "runtime.health_check",
]);
export type AuditEventType = z.infer<typeof AuditEventType>;

export const TargetType = z.enum(["agent", "run", "schedule", "permission", "runtime"]);
export type TargetType = z.infer<typeof TargetType>;

// --- Schedules ---

export const SchedulePreset = z.enum([
  "manual_only",
  "every_hour",
  "every_4_hours",
  "twice_daily",
  "daily",
  "weekdays",
  "custom",
]);
export type SchedulePreset = z.infer<typeof SchedulePreset>;

// --- Appearance ---

export const SkinTone = z.enum(["light", "medium_light", "medium", "medium_dark", "dark"]);
export type SkinTone = z.infer<typeof SkinTone>;

export const HairStyle = z.enum(["short", "medium", "long", "ponytail", "bun", "buzz", "none"]);
export type HairStyle = z.infer<typeof HairStyle>;

export const HairColor = z.enum([
  "black",
  "brown",
  "blonde",
  "red",
  "gray",
  "blue",
  "pink",
  "green",
]);
export type HairColor = z.infer<typeof HairColor>;

export const OutfitStyle = z.enum(["casual", "formal", "tech", "creative", "uniform"]);
export type OutfitStyle = z.infer<typeof OutfitStyle>;

export const OutfitColor = z.enum([
  "blue",
  "red",
  "green",
  "purple",
  "orange",
  "gray",
  "black",
  "white",
]);
export type OutfitColor = z.infer<typeof OutfitColor>;

export const GlassesStyle = z.enum(["none", "round", "square", "aviator"]);
export type GlassesStyle = z.infer<typeof GlassesStyle>;

export const AccessoryType = z.enum(["none", "headphones", "hat", "scarf", "earring"]);
export type AccessoryType = z.infer<typeof AccessoryType>;

export const BadgeStyle = z.enum(["none", "star", "heart", "lightning", "gear", "leaf"]);
export type BadgeStyle = z.infer<typeof BadgeStyle>;
