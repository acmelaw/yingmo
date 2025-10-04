CREATE TABLE `yjs_documents` (
	`id` text PRIMARY KEY NOT NULL,
	`tenant_id` text NOT NULL,
	`state` text NOT NULL,
	`last_updated` integer NOT NULL,
	`version` integer DEFAULT 0 NOT NULL,
	FOREIGN KEY (`tenant_id`) REFERENCES `tenants`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `note_edits` (
	`id` text PRIMARY KEY NOT NULL,
	`note_id` text NOT NULL,
	`user_id` text,
	`text` text NOT NULL,
	`tags` text,
	`timestamp` integer NOT NULL,
	`change_type` text NOT NULL,
	`device` text,
	FOREIGN KEY (`note_id`) REFERENCES `notes`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `notes` (
	`id` text PRIMARY KEY NOT NULL,
	`type` text DEFAULT 'text' NOT NULL,
	`tenant_id` text NOT NULL,
	`user_id` text NOT NULL,
	`tags` text,
	`category` text,
	`archived` integer DEFAULT false NOT NULL,
	`metadata` text,
	`created` integer NOT NULL,
	`updated` integer NOT NULL,
	`content` text NOT NULL,
	`text` text,
	`tiptap_content` text,
	FOREIGN KEY (`tenant_id`) REFERENCES `tenants`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `sessions` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`expires_at` integer NOT NULL,
	`token` text NOT NULL,
	`ip_address` text,
	`user_agent` text,
	`created_at` integer NOT NULL,
	`last_active` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `tags` (
	`id` text PRIMARY KEY NOT NULL,
	`tenant_id` text NOT NULL,
	`name` text NOT NULL,
	`display_name` text,
	`description` text,
	`color` text,
	`parent_id` text,
	`use_count` integer DEFAULT 0 NOT NULL,
	`last_used` integer,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`tenant_id`) REFERENCES `tenants`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `tenants` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`slug` text NOT NULL,
	`settings` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `users` (
	`id` text PRIMARY KEY NOT NULL,
	`tenant_id` text NOT NULL,
	`email` text NOT NULL,
	`name` text,
	`auto_extract_tags` integer DEFAULT true NOT NULL,
	`clean_content_on_extract` integer DEFAULT false NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`tenant_id`) REFERENCES `tenants`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `doc_tenant_idx` ON `yjs_documents` (`tenant_id`);--> statement-breakpoint
CREATE INDEX `edit_note_idx` ON `note_edits` (`note_id`);--> statement-breakpoint
CREATE INDEX `edit_timestamp_idx` ON `note_edits` (`timestamp`);--> statement-breakpoint
CREATE INDEX `note_user_idx` ON `notes` (`user_id`);--> statement-breakpoint
CREATE INDEX `note_tenant_idx` ON `notes` (`tenant_id`);--> statement-breakpoint
CREATE INDEX `note_type_idx` ON `notes` (`type`);--> statement-breakpoint
CREATE INDEX `note_updated_idx` ON `notes` (`updated`);--> statement-breakpoint
CREATE INDEX `note_archived_idx` ON `notes` (`archived`);--> statement-breakpoint
CREATE UNIQUE INDEX `sessions_token_unique` ON `sessions` (`token`);--> statement-breakpoint
CREATE INDEX `session_user_idx` ON `sessions` (`user_id`);--> statement-breakpoint
CREATE INDEX `session_token_idx` ON `sessions` (`token`);--> statement-breakpoint
CREATE INDEX `session_expires_idx` ON `sessions` (`expires_at`);--> statement-breakpoint
CREATE INDEX `tag_name_idx` ON `tags` (`name`);--> statement-breakpoint
CREATE INDEX `tag_tenant_idx` ON `tags` (`tenant_id`);--> statement-breakpoint
CREATE INDEX `tag_use_count_idx` ON `tags` (`use_count`);--> statement-breakpoint
CREATE UNIQUE INDEX `tenants_slug_unique` ON `tenants` (`slug`);--> statement-breakpoint
CREATE INDEX `user_email_idx` ON `users` (`email`);--> statement-breakpoint
CREATE INDEX `user_tenant_idx` ON `users` (`tenant_id`);