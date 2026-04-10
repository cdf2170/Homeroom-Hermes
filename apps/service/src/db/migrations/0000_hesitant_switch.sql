CREATE TABLE `agents` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`purpose` text DEFAULT '' NOT NULL,
	`archetype` text DEFAULT 'helper' NOT NULL,
	`vibe` text DEFAULT 'calm' NOT NULL,
	`smartness_level` text DEFAULT 'standard' NOT NULL,
	`runtime_mode` text DEFAULT 'local' NOT NULL,
	`runtime_preference` text,
	`enabled` integer DEFAULT false NOT NULL,
	`background_enabled` integer DEFAULT false NOT NULL,
	`status` text DEFAULT 'offline' NOT NULL,
	`scene_room_id` text DEFAULT 'focus_room' NOT NULL,
	`scene_state` text DEFAULT 'idle' NOT NULL,
	`last_run_at` text,
	`last_run_status` text,
	`schedule_summary` text,
	`permission_profile_id` text,
	`appearance_id` text,
	`role` text DEFAULT '' NOT NULL,
	`instructions` text DEFAULT '' NOT NULL,
	`audience_notes` text DEFAULT '' NOT NULL,
	`environment_notes` text DEFAULT '' NOT NULL,
	`memory_notes` text DEFAULT '' NOT NULL,
	`check_in_frequency` text DEFAULT 'on_completion' NOT NULL,
	`escalation_behavior` text DEFAULT 'ask' NOT NULL,
	`task_style` text DEFAULT 'methodical' NOT NULL,
	`notify_on_complete` integer DEFAULT true NOT NULL,
	`notify_on_error` integer DEFAULT true NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `audit_events` (
	`id` text PRIMARY KEY NOT NULL,
	`actor` text DEFAULT 'user' NOT NULL,
	`source_mode` text DEFAULT 'user' NOT NULL,
	`event_type` text NOT NULL,
	`target_type` text NOT NULL,
	`target_id` text NOT NULL,
	`timestamp` text NOT NULL,
	`summary` text DEFAULT '' NOT NULL,
	`permission_context` text,
	`run_id` text
);
--> statement-breakpoint
CREATE INDEX `audit_events_target_idx` ON `audit_events` (`target_type`,`target_id`);--> statement-breakpoint
CREATE INDEX `audit_events_timestamp_idx` ON `audit_events` (`timestamp`);--> statement-breakpoint
CREATE TABLE `memory_items` (
	`id` text PRIMARY KEY NOT NULL,
	`agent_id` text NOT NULL,
	`content` text NOT NULL,
	`category` text DEFAULT 'fact' NOT NULL,
	`pinned` integer DEFAULT false NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `memory_items_agent_id_idx` ON `memory_items` (`agent_id`);--> statement-breakpoint
CREATE TABLE `permission_profiles` (
	`id` text PRIMARY KEY NOT NULL,
	`agent_id` text NOT NULL,
	`safety_level` text DEFAULT 'strict' NOT NULL,
	`tool_scopes` text DEFAULT '[]' NOT NULL,
	`data_scopes` text DEFAULT '[]' NOT NULL,
	`network_access` integer DEFAULT false NOT NULL,
	`network_access_mode` text DEFAULT 'none' NOT NULL,
	`requires_approval_for` text DEFAULT '["file:write","shell:exec"]' NOT NULL,
	`background_allowed` integer DEFAULT false NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `permission_profiles_agent_id_unique` ON `permission_profiles` (`agent_id`);--> statement-breakpoint
CREATE TABLE `rule_items` (
	`id` text PRIMARY KEY NOT NULL,
	`agent_id` text NOT NULL,
	`content` text NOT NULL,
	`priority` integer DEFAULT 50 NOT NULL,
	`enabled` integer DEFAULT true NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `rule_items_agent_id_idx` ON `rule_items` (`agent_id`);--> statement-breakpoint
CREATE TABLE `runs` (
	`id` text PRIMARY KEY NOT NULL,
	`agent_id` text NOT NULL,
	`trigger` text DEFAULT 'manual' NOT NULL,
	`status` text DEFAULT 'pending' NOT NULL,
	`started_at` text NOT NULL,
	`finished_at` text,
	`input_summary` text DEFAULT '' NOT NULL,
	`output_summary` text DEFAULT '' NOT NULL,
	`error_summary` text,
	`backend_ref` text
);
--> statement-breakpoint
CREATE INDEX `runs_agent_id_idx` ON `runs` (`agent_id`);--> statement-breakpoint
CREATE INDEX `runs_started_at_idx` ON `runs` (`started_at`);--> statement-breakpoint
CREATE TABLE `runtime_projections` (
	`agent_id` text PRIMARY KEY NOT NULL,
	`backend_ref` text,
	`model_ref` text,
	`provider_ref` text,
	`state` text DEFAULT 'unknown' NOT NULL,
	`current_run_id` text,
	`scheduler_state` text DEFAULT 'inactive' NOT NULL,
	`workspace_path` text,
	`last_synced_at` text
);
--> statement-breakpoint
CREATE TABLE `schedules` (
	`id` text PRIMARY KEY NOT NULL,
	`agent_id` text NOT NULL,
	`enabled` integer DEFAULT false NOT NULL,
	`preset` text DEFAULT 'manual_only' NOT NULL,
	`plain_english` text DEFAULT 'Manual only' NOT NULL,
	`backend_expression` text,
	`timezone` text DEFAULT 'UTC' NOT NULL,
	`next_run_at` text,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `schedules_agent_id_unique` ON `schedules` (`agent_id`);--> statement-breakpoint
CREATE TABLE `settings` (
	`id` text PRIMARY KEY DEFAULT 'singleton' NOT NULL,
	`default_runtime_mode` text DEFAULT 'local' NOT NULL,
	`default_smart_level` text DEFAULT 'standard' NOT NULL,
	`default_safety_level` text DEFAULT 'strict' NOT NULL,
	`openclaw_workspace_path` text DEFAULT '' NOT NULL,
	`provider_meta` text DEFAULT '{}' NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `trust_findings` (
	`id` text PRIMARY KEY NOT NULL,
	`scope` text DEFAULT 'agent' NOT NULL,
	`target_id` text,
	`level` text DEFAULT 'ok' NOT NULL,
	`code` text NOT NULL,
	`title` text NOT NULL,
	`detail` text DEFAULT '' NOT NULL,
	`recommended_action` text DEFAULT '' NOT NULL,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `trust_findings_scope_target_idx` ON `trust_findings` (`scope`,`target_id`);