CREATE TABLE `BadgeApplication` (
	`id` text PRIMARY KEY NOT NULL,
	`userId` text NOT NULL,
	`badgeId` text NOT NULL,
	`explanation` text NOT NULL,
	`details` text,
	`evidenceUrlsJson` text DEFAULT '[]' NOT NULL,
	`adminNote` text,
	`status` text DEFAULT 'pending' NOT NULL,
	`reviewNote` text,
	`feedbackNote` text,
	`reviewedById` text,
	`reviewedAt` integer,
	`createdAt` integer NOT NULL,
	`updatedAt` integer NOT NULL,
	FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`badgeId`) REFERENCES `Badge`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`reviewedById`) REFERENCES `User`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE INDEX `badge_application_user_idx` ON `BadgeApplication` (`userId`,`createdAt`);--> statement-breakpoint
CREATE INDEX `badge_application_status_idx` ON `BadgeApplication` (`status`,`createdAt`);--> statement-breakpoint
CREATE INDEX `badge_application_badge_idx` ON `BadgeApplication` (`badgeId`,`status`);--> statement-breakpoint
CREATE TABLE `ImpactProject` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`organization` text NOT NULL,
	`category` text NOT NULL,
	`amountCents` integer NOT NULL,
	`currency` text DEFAULT 'EUR' NOT NULL,
	`purpose` text,
	`occurredAt` integer NOT NULL,
	`status` text DEFAULT 'planned' NOT NULL,
	`published` integer DEFAULT false NOT NULL,
	`proofUrl` text,
	`internalNote` text,
	`createdById` text,
	`createdAt` integer NOT NULL,
	`updatedAt` integer NOT NULL,
	FOREIGN KEY (`createdById`) REFERENCES `User`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE INDEX `impact_status_idx` ON `ImpactProject` (`status`,`published`);--> statement-breakpoint
CREATE INDEX `impact_category_idx` ON `ImpactProject` (`category`);--> statement-breakpoint
ALTER TABLE `Badge` ADD `category` text DEFAULT 'verified' NOT NULL;--> statement-breakpoint
ALTER TABLE `Badge` ADD `grantMethod` text DEFAULT 'admin' NOT NULL;--> statement-breakpoint
ALTER TABLE `Badge` ADD `publiclyVisible` integer DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE `Badge` ADD `priority` integer DEFAULT 100 NOT NULL;--> statement-breakpoint
ALTER TABLE `Badge` ADD `periodMonths` integer;--> statement-breakpoint
ALTER TABLE `Badge` ADD `thresholdValue` integer;--> statement-breakpoint
ALTER TABLE `Badge` ADD `thresholdUnit` text;--> statement-breakpoint
ALTER TABLE `Badge` ADD `evidenceDe` text;--> statement-breakpoint
ALTER TABLE `Badge` ADD `evidenceEn` text;--> statement-breakpoint
ALTER TABLE `Badge` ADD `active` integer DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE `UserBadge` ADD `source` text DEFAULT 'admin' NOT NULL;--> statement-breakpoint
ALTER TABLE `UserBadge` ADD `verifiedAt` integer;--> statement-breakpoint
ALTER TABLE `UserBadge` ADD `verifiedBy` text REFERENCES User(id);--> statement-breakpoint
ALTER TABLE `UserBadge` ADD `publicSummary` text;--> statement-breakpoint
ALTER TABLE `UserBadge` ADD `periodLabel` text;--> statement-breakpoint
ALTER TABLE `UserBadge` ADD `revokedAt` integer;--> statement-breakpoint
ALTER TABLE `UserBadge` ADD `revokedById` text REFERENCES User(id);--> statement-breakpoint
CREATE INDEX `user_badge_user_idx` ON `UserBadge` (`userId`);