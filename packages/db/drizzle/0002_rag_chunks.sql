CREATE TABLE `email_chunks` (
	`id` text PRIMARY KEY NOT NULL,
	`email_id` text NOT NULL,
	`account_id` text NOT NULL,
	`chunk_index` integer NOT NULL,
	`content` text NOT NULL,
	`embedding` text NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`email_id`) REFERENCES `emails`(`id`) ON DELETE CASCADE
);
