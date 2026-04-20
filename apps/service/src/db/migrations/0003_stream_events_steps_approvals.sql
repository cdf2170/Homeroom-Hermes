CREATE TABLE `stream_events` (
	`sequence` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`type` text NOT NULL,
	`created_at` text NOT NULL,
	`payload` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `stream_events_type_idx` ON `stream_events` (`type`);--> statement-breakpoint
CREATE INDEX `stream_events_created_at_idx` ON `stream_events` (`created_at`);--> statement-breakpoint
CREATE TABLE `run_steps` (
	`id` text PRIMARY KEY NOT NULL,
	`run_id` text NOT NULL,
	`seq` integer NOT NULL,
	`kind` text NOT NULL,
	`content` text NOT NULL,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `run_steps_run_id_seq_idx` ON `run_steps` (`run_id`,`seq`);--> statement-breakpoint
CREATE TABLE `approvals` (
	`id` text PRIMARY KEY NOT NULL,
	`run_id` text NOT NULL,
	`agent_id` text NOT NULL,
	`kind` text NOT NULL,
	`reason` text NOT NULL,
	`preview` text,
	`created_at` text NOT NULL,
	`resolved_at` text,
	`resolution` text
);
--> statement-breakpoint
CREATE INDEX `approvals_agent_id_idx` ON `approvals` (`agent_id`);--> statement-breakpoint
CREATE INDEX `approvals_run_id_idx` ON `approvals` (`run_id`);--> statement-breakpoint
CREATE INDEX `approvals_resolution_idx` ON `approvals` (`resolution`);
