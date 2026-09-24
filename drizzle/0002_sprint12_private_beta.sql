CREATE TABLE `BetaInvite` (
	`id` text PRIMARY KEY NOT NULL,
	`codeHash` text NOT NULL,
	`codeHint` text NOT NULL,
	`label` text,
	`restrictedEmail` text,
	`durationDays` integer DEFAULT 30 NOT NULL,
	`status` text DEFAULT 'active' NOT NULL,
	`expiresAt` integer,
	`createdById` text,
	`redeemedById` text,
	`redeemedAt` integer,
	`disabledAt` integer,
	`createdAt` integer NOT NULL,
	`updatedAt` integer NOT NULL,
	FOREIGN KEY (`createdById`) REFERENCES `User`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`redeemedById`) REFERENCES `User`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE UNIQUE INDEX `BetaInvite_codeHash_unique` ON `BetaInvite` (`codeHash`);--> statement-breakpoint
CREATE INDEX `beta_invite_status_idx` ON `BetaInvite` (`status`);--> statement-breakpoint
CREATE INDEX `beta_invite_redeemed_idx` ON `BetaInvite` (`redeemedById`);--> statement-breakpoint
CREATE TABLE `BetaAccess` (
	`id` text PRIMARY KEY NOT NULL,
	`userId` text NOT NULL,
	`inviteId` text,
	`status` text DEFAULT 'active' NOT NULL,
	`startsAt` integer NOT NULL,
	`endsAt` integer NOT NULL,
	`revokedAt` integer,
	`revokedById` text,
	`createdAt` integer NOT NULL,
	`updatedAt` integer NOT NULL,
	FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`inviteId`) REFERENCES `BetaInvite`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`revokedById`) REFERENCES `User`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE UNIQUE INDEX `BetaAccess_userId_unique` ON `BetaAccess` (`userId`);--> statement-breakpoint
CREATE INDEX `beta_access_status_idx` ON `BetaAccess` (`status`,`endsAt`);--> statement-breakpoint
ALTER TABLE `Conversation` ADD `directKey` text;--> statement-breakpoint
CREATE UNIQUE INDEX `conversation_direct_key_unique` ON `Conversation` (`directKey`);--> statement-breakpoint
UPDATE `Notification` SET `readAt` = `createdAt` WHERE `type` = 'message' AND `readAt` IS NULL;
