CREATE TABLE `analytics_summary` (
	`id` int AUTO_INCREMENT NOT NULL,
	`date` varchar(10) NOT NULL,
	`total_queries` int DEFAULT 0,
	`total_users` int DEFAULT 0,
	`avg_response_time` int DEFAULT 0,
	`success_rate` varchar(10) DEFAULT '100',
	`top_query_type` varchar(50),
	`top_location` varchar(255),
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `analytics_summary_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `api_logs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`api_name` varchar(100) NOT NULL,
	`endpoint` varchar(255) NOT NULL,
	`status_code` int,
	`response_time` int,
	`success` int DEFAULT 1,
	`error_message` text,
	`request_data` text,
	`response_data` text,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `api_logs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `error_logs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`error_type` varchar(100) NOT NULL,
	`error_message` text NOT NULL,
	`stack_trace` text,
	`context` text,
	`severity` varchar(20) DEFAULT 'error',
	`resolved` int DEFAULT 0,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `error_logs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `frequent_routes` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`description` text,
	`start_location` varchar(255) NOT NULL,
	`end_location` varchar(255) NOT NULL,
	`start_lat` varchar(20) NOT NULL,
	`start_lng` varchar(20) NOT NULL,
	`end_lat` varchar(20) NOT NULL,
	`end_lng` varchar(20) NOT NULL,
	`is_active` int DEFAULT 1,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `frequent_routes_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `queries` (
	`id` int AUTO_INCREMENT NOT NULL,
	`wa_contact_id` int NOT NULL,
	`query_text` text NOT NULL,
	`query_type` varchar(50) NOT NULL,
	`location` varchar(255),
	`latitude` varchar(20),
	`longitude` varchar(20),
	`response_time` int,
	`success` int DEFAULT 1,
	`error_message` text,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `queries_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `query_responses` (
	`id` int AUTO_INCREMENT NOT NULL,
	`query_id` int NOT NULL,
	`wa_contact_id` int NOT NULL,
	`response_text` text NOT NULL,
	`traffic_data` text,
	`weather_data` text,
	`incident_data` text,
	`message_id` varchar(255),
	`delivery_status` varchar(50) DEFAULT 'pending',
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `query_responses_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `whatsapp_contacts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`wa_id` varchar(64) NOT NULL,
	`phone_number` varchar(20) NOT NULL,
	`display_name` varchar(255),
	`last_message_at` timestamp,
	`message_count` int DEFAULT 0,
	`is_blocked` int DEFAULT 0,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `whatsapp_contacts_id` PRIMARY KEY(`id`),
	CONSTRAINT `whatsapp_contacts_wa_id_unique` UNIQUE(`wa_id`)
);
