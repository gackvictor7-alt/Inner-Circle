ALTER TABLE `PrivacySettings` ADD `metricsVisibilityJson` text DEFAULT '{}' NOT NULL;--> statement-breakpoint
ALTER TABLE `Profile` ADD `offeringJson` text DEFAULT '[]' NOT NULL;