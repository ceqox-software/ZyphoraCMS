CREATE TABLE `themes` (
	`slug` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`version` text NOT NULL,
	`author` text,
	`description` text,
	`bundled` integer DEFAULT false NOT NULL,
	`installed_at` integer DEFAULT (unixepoch()) NOT NULL
);