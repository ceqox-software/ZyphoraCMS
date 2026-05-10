CREATE TABLE `roles` (
	`slug` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`permissions` text DEFAULT '[]' NOT NULL,
	`system` integer DEFAULT false NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL
);
--> statement-breakpoint
INSERT INTO `roles` (`slug`, `name`, `permissions`, `system`) VALUES
	('admin', 'Admin', '["manage_users","manage_roles","manage_posts_any","manage_posts_own","manage_media","manage_themes","manage_settings"]', 1),
	('editor', 'Editor', '["manage_posts_any","manage_posts_own","manage_media"]', 1),
	('author', 'Author', '["manage_posts_own","manage_media"]', 1);
