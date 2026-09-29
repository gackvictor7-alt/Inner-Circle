CREATE TABLE `DealConfirmation` (
	`id` text PRIMARY KEY NOT NULL,
	`dealId` text NOT NULL,
	`userId` text NOT NULL,
	`confirmedAt` integer NOT NULL,
	`createdAt` integer NOT NULL,
	FOREIGN KEY (`dealId`) REFERENCES `DealRecord`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `deal_confirmation_unique` ON `DealConfirmation` (`dealId`,`userId`);--> statement-breakpoint
CREATE INDEX `deal_confirmation_user_idx` ON `DealConfirmation` (`userId`);--> statement-breakpoint
CREATE TABLE `DealRecord` (
	`id` text PRIMARY KEY NOT NULL,
	`declaredById` text NOT NULL,
	`counterpartyId` text NOT NULL,
	`sourceOpportunityId` text,
	`category` text NOT NULL,
	`volumeBand` text DEFAULT 'undisclosed' NOT NULL,
	`volumeCents` integer,
	`feeTierId` text,
	`status` text DEFAULT 'pending_confirmation' NOT NULL,
	`closedAt` integer NOT NULL,
	`confirmedAt` integer,
	`privateNote` text,
	`createdAt` integer NOT NULL,
	`updatedAt` integer NOT NULL,
	FOREIGN KEY (`declaredById`) REFERENCES `User`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`counterpartyId`) REFERENCES `User`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`sourceOpportunityId`) REFERENCES `BusinessOpportunity`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE INDEX `deal_record_declared_idx` ON `DealRecord` (`declaredById`,`status`);--> statement-breakpoint
CREATE INDEX `deal_record_counterparty_idx` ON `DealRecord` (`counterpartyId`,`status`);--> statement-breakpoint
CREATE INDEX `deal_record_status_idx` ON `DealRecord` (`status`,`closedAt`);--> statement-breakpoint
CREATE TABLE `DealTermsAcceptance` (
	`id` text PRIMARY KEY NOT NULL,
	`userId` text NOT NULL,
	`termsVersion` text NOT NULL,
	`subjectType` text NOT NULL,
	`subjectId` text,
	`dealType` text,
	`volumeCents` integer,
	`feeTierId` text,
	`feeRateBps` integer,
	`feeNegotiable` integer DEFAULT false NOT NULL,
	`acceptedAt` integer NOT NULL,
	`createdAt` integer NOT NULL,
	FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `deal_terms_user_idx` ON `DealTermsAcceptance` (`userId`,`acceptedAt`);--> statement-breakpoint
CREATE INDEX `deal_terms_subject_idx` ON `DealTermsAcceptance` (`subjectType`,`subjectId`);