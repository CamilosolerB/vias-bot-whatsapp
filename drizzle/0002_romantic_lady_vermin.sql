CREATE TABLE `telegram_users` (
	`id` int AUTO_INCREMENT NOT NULL,
	`telegram_id` varchar(64) NOT NULL,
	`username` varchar(255),
	`first_name` varchar(255),
	`last_name` varchar(255),
	`last_message_at` timestamp,
	`message_count` int DEFAULT 0,
	`is_blocked` int DEFAULT 0,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `telegram_users_id` PRIMARY KEY(`id`),
	CONSTRAINT `telegram_users_telegram_id_unique` UNIQUE(`telegram_id`)
);
--> statement-breakpoint
DROP TABLE `whatsapp_contacts`;