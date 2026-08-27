CREATE TABLE `contacts` (
	`id` text PRIMARY KEY NOT NULL,
	`email` text NOT NULL UNIQUE,
	`display_name` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `emails` (
	`id` text PRIMARY KEY NOT NULL,
	`account_id` text NOT NULL,
	`thread_id` text,
	`from_address` text NOT NULL,
	`to_address` text NOT NULL,
	`subject` text,
	`snippet` text,
	`body` text,
	`is_read` integer DEFAULT false NOT NULL,
	`received_at` integer,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
