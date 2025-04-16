CREATE TABLE `categories` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `name_idx` ON `categories` (`name`);--> statement-breakpoint
CREATE TABLE `mugs` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`description` text NOT NULL,
	`price` real NOT NULL,
	`category_id` text NOT NULL,
	`image` text,
	`created_at` integer DEFAULT (strftime('%s', 'now')),
	`updated_at` integer DEFAULT (strftime('%s', 'now')),
	FOREIGN KEY (`category_id`) REFERENCES `categories`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `mug_id_idx` ON `mugs` (`id`);--> statement-breakpoint
CREATE INDEX `mug_name_idx` ON `mugs` (`name`);--> statement-breakpoint
CREATE INDEX `mug_description_idx` ON `mugs` (`description`);--> statement-breakpoint
CREATE INDEX `mug_price_idx` ON `mugs` (`price`);--> statement-breakpoint
CREATE INDEX `mug_category_id_idx` ON `mugs` (`category_id`);