CREATE TABLE `BadgeApplicationEvent` (
	`id` text PRIMARY KEY NOT NULL,
	`applicationId` text NOT NULL,
	`actorId` text,
	`eventType` text NOT NULL,
	`message` text,
	`createdAt` integer NOT NULL,
	FOREIGN KEY (`applicationId`) REFERENCES `BadgeApplication`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`actorId`) REFERENCES `User`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE INDEX `badge_application_event_history_idx` ON `BadgeApplicationEvent` (`applicationId`,`createdAt`);