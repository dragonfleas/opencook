CREATE TABLE `profiles` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`email` text NOT NULL,
	`phone_number` text,
	`shipping_first_name` text NOT NULL,
	`shipping_last_name` text NOT NULL,
	`shipping_address_line1` text NOT NULL,
	`shipping_address_line2` text,
	`shipping_city` text NOT NULL,
	`shipping_state` text NOT NULL,
	`shipping_postal_code` text NOT NULL,
	`shipping_country` text NOT NULL,
	`billing_first_name` text,
	`billing_last_name` text,
	`billing_address_line1` text,
	`billing_address_line2` text,
	`billing_city` text,
	`billing_state` text,
	`billing_postal_code` text,
	`billing_country` text,
	`payment_method_type` text NOT NULL,
	`payment_method_encrypted_data` text NOT NULL,
	`payment_holder_name` text NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`last_used_at` text,
	`purchase_count` integer DEFAULT 0 NOT NULL,
	`is_active` integer DEFAULT true NOT NULL,
	`daily_purchases` text DEFAULT '{}' NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `profiles_name_unique` ON `profiles` (`name`);--> statement-breakpoint
CREATE INDEX `idx_profiles_name` ON `profiles` (`name`);--> statement-breakpoint
CREATE INDEX `idx_profiles_email` ON `profiles` (`email`);--> statement-breakpoint
CREATE INDEX `idx_profiles_is_active` ON `profiles` (`is_active`);--> statement-breakpoint
CREATE INDEX `idx_profiles_created_at` ON `profiles` (`created_at`);