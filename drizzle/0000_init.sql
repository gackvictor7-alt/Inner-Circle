CREATE TABLE `AccountDeletionRequest` (
	`id` text PRIMARY KEY NOT NULL,
	`userId` text NOT NULL,
	`reason` text,
	`status` text DEFAULT 'pending' NOT NULL,
	`createdAt` integer NOT NULL,
	`processedAt` integer,
	`processedById` text,
	`note` text,
	FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`processedById`) REFERENCES `User`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE UNIQUE INDEX `AccountDeletionRequest_userId_unique` ON `AccountDeletionRequest` (`userId`);--> statement-breakpoint
CREATE INDEX `account_deletion_status_idx` ON `AccountDeletionRequest` (`status`);--> statement-breakpoint
CREATE TABLE `AdminAuditLog` (
	`id` text PRIMARY KEY NOT NULL,
	`actorId` text,
	`action` text NOT NULL,
	`entityType` text,
	`entityId` text,
	`metaJson` text DEFAULT '{}' NOT NULL,
	`createdAt` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `audit_created_idx` ON `AdminAuditLog` (`createdAt`);--> statement-breakpoint
CREATE INDEX `audit_action_idx` ON `AdminAuditLog` (`action`);--> statement-breakpoint
CREATE TABLE `AuthToken` (
	`id` text PRIMARY KEY NOT NULL,
	`userId` text NOT NULL,
	`type` text NOT NULL,
	`tokenHash` text NOT NULL,
	`expiresAt` integer NOT NULL,
	`usedAt` integer,
	`createdAt` integer NOT NULL,
	FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `AuthToken_tokenHash_unique` ON `AuthToken` (`tokenHash`);--> statement-breakpoint
CREATE INDEX `auth_token_user_idx` ON `AuthToken` (`userId`,`type`);--> statement-breakpoint
CREATE TABLE `Badge` (
	`id` text PRIMARY KEY NOT NULL,
	`slug` text NOT NULL,
	`kind` text NOT NULL,
	`titleDe` text NOT NULL,
	`titleEn` text NOT NULL,
	`descDe` text,
	`descEn` text,
	`iconKey` text DEFAULT 'award' NOT NULL,
	`position` integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `Badge_slug_unique` ON `Badge` (`slug`);--> statement-breakpoint
CREATE TABLE `Block` (
	`id` text PRIMARY KEY NOT NULL,
	`blockerId` text NOT NULL,
	`blockedId` text NOT NULL,
	`createdAt` integer NOT NULL,
	FOREIGN KEY (`blockerId`) REFERENCES `User`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`blockedId`) REFERENCES `User`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `block_unique` ON `Block` (`blockerId`,`blockedId`);--> statement-breakpoint
CREATE TABLE `BusinessOpportunity` (
	`id` text PRIMARY KEY NOT NULL,
	`ownerId` text NOT NULL,
	`title` text NOT NULL,
	`slug` text NOT NULL,
	`type` text NOT NULL,
	`category` text,
	`summary` text NOT NULL,
	`description` text NOT NULL,
	`industry` text,
	`location` text,
	`remote` integer DEFAULT false NOT NULL,
	`offering` text,
	`seeking` text,
	`requirements` text,
	`imageUrl` text,
	`visibility` text DEFAULT 'members' NOT NULL,
	`confidentiality` text DEFAULT 'standard' NOT NULL,
	`status` text DEFAULT 'draft' NOT NULL,
	`isDemo` integer DEFAULT false NOT NULL,
	`publishedAt` integer,
	`closedAt` integer,
	`createdAt` integer NOT NULL,
	`updatedAt` integer NOT NULL,
	`deletedAt` integer,
	FOREIGN KEY (`ownerId`) REFERENCES `User`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `BusinessOpportunity_slug_unique` ON `BusinessOpportunity` (`slug`);--> statement-breakpoint
CREATE INDEX `opportunity_status_idx` ON `BusinessOpportunity` (`status`,`createdAt`);--> statement-breakpoint
CREATE INDEX `opportunity_owner_idx` ON `BusinessOpportunity` (`ownerId`);--> statement-breakpoint
CREATE TABLE `ConnectionRequest` (
	`id` text PRIMARY KEY NOT NULL,
	`fromUserId` text NOT NULL,
	`toUserId` text NOT NULL,
	`message` text,
	`status` text DEFAULT 'pending' NOT NULL,
	`fromTrial` integer DEFAULT false NOT NULL,
	`createdAt` integer NOT NULL,
	`respondedAt` integer,
	FOREIGN KEY (`fromUserId`) REFERENCES `User`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`toUserId`) REFERENCES `User`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `connection_request_unique` ON `ConnectionRequest` (`fromUserId`,`toUserId`);--> statement-breakpoint
CREATE INDEX `connection_request_to_idx` ON `ConnectionRequest` (`toUserId`,`status`);--> statement-breakpoint
CREATE INDEX `connection_request_from_idx` ON `ConnectionRequest` (`fromUserId`,`status`);--> statement-breakpoint
CREATE TABLE `Connection` (
	`id` text PRIMARY KEY NOT NULL,
	`userAId` text NOT NULL,
	`userBId` text NOT NULL,
	`source` text DEFAULT 'connection_request' NOT NULL,
	`createdAt` integer NOT NULL,
	`endedAt` integer,
	FOREIGN KEY (`userAId`) REFERENCES `User`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`userBId`) REFERENCES `User`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `connection_unique` ON `Connection` (`userAId`,`userBId`);--> statement-breakpoint
CREATE INDEX `connection_b_idx` ON `Connection` (`userBId`);--> statement-breakpoint
CREATE TABLE `ConversationParticipant` (
	`id` text PRIMARY KEY NOT NULL,
	`conversationId` text NOT NULL,
	`userId` text NOT NULL,
	`lastReadAt` integer,
	`createdAt` integer NOT NULL,
	FOREIGN KEY (`conversationId`) REFERENCES `Conversation`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `conversation_participant_unique` ON `ConversationParticipant` (`conversationId`,`userId`);--> statement-breakpoint
CREATE INDEX `conversation_participant_user_idx` ON `ConversationParticipant` (`userId`);--> statement-breakpoint
CREATE TABLE `Conversation` (
	`id` text PRIMARY KEY NOT NULL,
	`kind` text DEFAULT 'direct' NOT NULL,
	`subject` text,
	`opportunityId` text,
	`createdAt` integer NOT NULL,
	`lastMessageAt` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `conversation_last_idx` ON `Conversation` (`lastMessageAt`);--> statement-breakpoint
CREATE TABLE `CourseModule` (
	`id` text PRIMARY KEY NOT NULL,
	`courseId` text NOT NULL,
	`title` text NOT NULL,
	`summary` text,
	`position` integer DEFAULT 0 NOT NULL,
	FOREIGN KEY (`courseId`) REFERENCES `Course`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `module_course_idx` ON `CourseModule` (`courseId`,`position`);--> statement-breakpoint
CREATE TABLE `Course` (
	`id` text PRIMARY KEY NOT NULL,
	`listingId` text NOT NULL,
	`level` text DEFAULT 'beginner' NOT NULL,
	`language` text DEFAULT 'de_en' NOT NULL,
	`durationMin` integer,
	`certificate` integer DEFAULT false NOT NULL,
	`isDemo` integer DEFAULT false NOT NULL,
	`createdAt` integer NOT NULL,
	FOREIGN KEY (`listingId`) REFERENCES `MarketplaceListing`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `Course_listingId_unique` ON `Course` (`listingId`);--> statement-breakpoint
CREATE TABLE `DevOutbox` (
	`id` text PRIMARY KEY NOT NULL,
	`channel` text NOT NULL,
	`to` text NOT NULL,
	`subject` text,
	`body` text NOT NULL,
	`template` text,
	`createdAt` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `outbox_created_idx` ON `DevOutbox` (`createdAt`);--> statement-breakpoint
CREATE TABLE `Enrollment` (
	`id` text PRIMARY KEY NOT NULL,
	`courseId` text NOT NULL,
	`userId` text NOT NULL,
	`source` text DEFAULT 'granted' NOT NULL,
	`progressPercent` integer DEFAULT 0 NOT NULL,
	`enrolledAt` integer NOT NULL,
	`completedAt` integer,
	FOREIGN KEY (`courseId`) REFERENCES `Course`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `enrollment_unique` ON `Enrollment` (`courseId`,`userId`);--> statement-breakpoint
CREATE INDEX `enrollment_user_idx` ON `Enrollment` (`userId`);--> statement-breakpoint
CREATE TABLE `EventApplication` (
	`id` text PRIMARY KEY NOT NULL,
	`eventId` text NOT NULL,
	`userId` text NOT NULL,
	`status` text DEFAULT 'applied' NOT NULL,
	`guests` integer DEFAULT 0 NOT NULL,
	`note` text,
	`createdAt` integer NOT NULL,
	`updatedAt` integer NOT NULL,
	FOREIGN KEY (`eventId`) REFERENCES `Event`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `event_application_unique` ON `EventApplication` (`eventId`,`userId`);--> statement-breakpoint
CREATE INDEX `event_app_user_idx` ON `EventApplication` (`userId`);--> statement-breakpoint
CREATE TABLE `Event` (
	`id` text PRIMARY KEY NOT NULL,
	`slug` text NOT NULL,
	`title` text NOT NULL,
	`category` text NOT NULL,
	`type` text NOT NULL,
	`summary` text NOT NULL,
	`description` text NOT NULL,
	`location` text,
	`city` text,
	`country` text,
	`startsAt` integer,
	`endsAt` integer,
	`capacity` integer,
	`imageUrl` text,
	`state` text DEFAULT 'concept' NOT NULL,
	`priceCents` integer,
	`currency` text DEFAULT 'EUR' NOT NULL,
	`applicationRequired` integer DEFAULT true NOT NULL,
	`waitlistEnabled` integer DEFAULT true NOT NULL,
	`isDemo` integer DEFAULT false NOT NULL,
	`createdAt` integer NOT NULL,
	`updatedAt` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `Event_slug_unique` ON `Event` (`slug`);--> statement-breakpoint
CREATE INDEX `event_state_idx` ON `Event` (`state`,`startsAt`);--> statement-breakpoint
CREATE INDEX `event_category_idx` ON `Event` (`category`);--> statement-breakpoint
CREATE TABLE `Follow` (
	`id` text PRIMARY KEY NOT NULL,
	`followerId` text NOT NULL,
	`followingId` text NOT NULL,
	`createdAt` integer NOT NULL,
	FOREIGN KEY (`followerId`) REFERENCES `User`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`followingId`) REFERENCES `User`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `follow_unique` ON `Follow` (`followerId`,`followingId`);--> statement-breakpoint
CREATE INDEX `follow_following_idx` ON `Follow` (`followingId`);--> statement-breakpoint
CREATE TABLE `Goal` (
	`id` text PRIMARY KEY NOT NULL,
	`slug` text NOT NULL,
	`labelDe` text NOT NULL,
	`labelEn` text NOT NULL,
	`position` integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `Goal_slug_unique` ON `Goal` (`slug`);--> statement-breakpoint
CREATE TABLE `Interest` (
	`id` text PRIMARY KEY NOT NULL,
	`slug` text NOT NULL,
	`labelDe` text NOT NULL,
	`labelEn` text NOT NULL,
	`groupDe` text NOT NULL,
	`groupEn` text NOT NULL,
	`position` integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `Interest_slug_unique` ON `Interest` (`slug`);--> statement-breakpoint
CREATE TABLE `InvestmentInterest` (
	`id` text PRIMARY KEY NOT NULL,
	`opportunityId` text NOT NULL,
	`userId` text NOT NULL,
	`note` text,
	`status` text DEFAULT 'submitted' NOT NULL,
	`createdAt` integer NOT NULL,
	FOREIGN KEY (`opportunityId`) REFERENCES `InvestmentOpportunity`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `investment_interest_unique` ON `InvestmentInterest` (`opportunityId`,`userId`);--> statement-breakpoint
CREATE TABLE `InvestmentOpportunity` (
	`id` text PRIMARY KEY NOT NULL,
	`submittedById` text,
	`publicName` text NOT NULL,
	`slug` text NOT NULL,
	`sector` text NOT NULL,
	`stage` text NOT NULL,
	`summary` text NOT NULL,
	`description` text NOT NULL,
	`investmentType` text NOT NULL,
	`targetAmountCents` integer,
	`minTicketCents` integer,
	`currency` text DEFAULT 'EUR' NOT NULL,
	`location` text,
	`status` text DEFAULT 'submitted' NOT NULL,
	`isDemo` integer DEFAULT false NOT NULL,
	`restrictedNote` text,
	`reviewedById` text,
	`reviewedAt` integer,
	`reviewNote` text,
	`createdAt` integer NOT NULL,
	`updatedAt` integer NOT NULL,
	FOREIGN KEY (`submittedById`) REFERENCES `User`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE UNIQUE INDEX `InvestmentOpportunity_slug_unique` ON `InvestmentOpportunity` (`slug`);--> statement-breakpoint
CREATE INDEX `investment_status_idx` ON `InvestmentOpportunity` (`status`,`createdAt`);--> statement-breakpoint
CREATE TABLE `Invoice` (
	`id` text PRIMARY KEY NOT NULL,
	`userId` text NOT NULL,
	`provider` text DEFAULT 'stripe' NOT NULL,
	`providerInvoiceId` text NOT NULL,
	`amountCents` integer NOT NULL,
	`currency` text DEFAULT 'EUR' NOT NULL,
	`status` text NOT NULL,
	`periodStart` integer,
	`periodEnd` integer,
	`hostedUrl` text,
	`createdAt` integer NOT NULL,
	FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `Invoice_providerInvoiceId_unique` ON `Invoice` (`providerInvoiceId`);--> statement-breakpoint
CREATE INDEX `invoice_user_idx` ON `Invoice` (`userId`,`createdAt`);--> statement-breakpoint
CREATE TABLE `LessonProgress` (
	`id` text PRIMARY KEY NOT NULL,
	`enrollmentId` text NOT NULL,
	`lessonId` text NOT NULL,
	`completedAt` integer NOT NULL,
	FOREIGN KEY (`enrollmentId`) REFERENCES `Enrollment`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`lessonId`) REFERENCES `Lesson`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `lesson_progress_unique` ON `LessonProgress` (`enrollmentId`,`lessonId`);--> statement-breakpoint
CREATE TABLE `Lesson` (
	`id` text PRIMARY KEY NOT NULL,
	`moduleId` text NOT NULL,
	`title` text NOT NULL,
	`summary` text,
	`position` integer DEFAULT 0 NOT NULL,
	`durationMin` integer,
	`videoUrl` text,
	`isPreview` integer DEFAULT false NOT NULL,
	FOREIGN KEY (`moduleId`) REFERENCES `CourseModule`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `lesson_module_idx` ON `Lesson` (`moduleId`,`position`);--> statement-breakpoint
CREATE TABLE `MarketplaceListing` (
	`id` text PRIMARY KEY NOT NULL,
	`sellerId` text NOT NULL,
	`title` text NOT NULL,
	`slug` text NOT NULL,
	`kind` text NOT NULL,
	`category` text,
	`summary` text NOT NULL,
	`description` text NOT NULL,
	`priceCents` integer NOT NULL,
	`currency` text DEFAULT 'EUR' NOT NULL,
	`imageUrl` text,
	`status` text DEFAULT 'draft' NOT NULL,
	`deliveryMode` text DEFAULT 'online' NOT NULL,
	`isDemo` integer DEFAULT false NOT NULL,
	`publishedAt` integer,
	`createdAt` integer NOT NULL,
	`updatedAt` integer NOT NULL,
	FOREIGN KEY (`sellerId`) REFERENCES `User`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `MarketplaceListing_slug_unique` ON `MarketplaceListing` (`slug`);--> statement-breakpoint
CREATE INDEX `listing_status_idx` ON `MarketplaceListing` (`status`,`createdAt`);--> statement-breakpoint
CREATE INDEX `listing_kind_idx` ON `MarketplaceListing` (`kind`);--> statement-breakpoint
CREATE TABLE `MembershipApplication` (
	`id` text PRIMARY KEY NOT NULL,
	`userId` text NOT NULL,
	`motivation` text NOT NULL,
	`background` text,
	`contribution` text,
	`goals` text,
	`status` text DEFAULT 'pending' NOT NULL,
	`reviewedById` text,
	`reviewedAt` integer,
	`reviewNote` text,
	`createdAt` integer NOT NULL,
	`updatedAt` integer NOT NULL,
	FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`reviewedById`) REFERENCES `User`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE UNIQUE INDEX `MembershipApplication_userId_unique` ON `MembershipApplication` (`userId`);--> statement-breakpoint
CREATE INDEX `membership_application_status_idx` ON `MembershipApplication` (`status`);--> statement-breakpoint
CREATE TABLE `MembershipCard` (
	`id` text PRIMARY KEY NOT NULL,
	`userId` text NOT NULL,
	`cardNumber` text NOT NULL,
	`publicId` text NOT NULL,
	`status` text DEFAULT 'active' NOT NULL,
	`issuedAt` integer NOT NULL,
	`revokedAt` integer,
	FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `MembershipCard_userId_unique` ON `MembershipCard` (`userId`);--> statement-breakpoint
CREATE UNIQUE INDEX `MembershipCard_cardNumber_unique` ON `MembershipCard` (`cardNumber`);--> statement-breakpoint
CREATE UNIQUE INDEX `MembershipCard_publicId_unique` ON `MembershipCard` (`publicId`);--> statement-breakpoint
CREATE INDEX `card_status_idx` ON `MembershipCard` (`status`);--> statement-breakpoint
CREATE TABLE `MembershipEvent` (
	`id` text PRIMARY KEY NOT NULL,
	`userId` text NOT NULL,
	`type` text NOT NULL,
	`provider` text DEFAULT 'dev' NOT NULL,
	`providerEventId` text,
	`metaJson` text DEFAULT '{}' NOT NULL,
	`createdAt` integer NOT NULL,
	FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `MembershipEvent_providerEventId_unique` ON `MembershipEvent` (`providerEventId`);--> statement-breakpoint
CREATE INDEX `membership_event_user_idx` ON `MembershipEvent` (`userId`,`createdAt`);--> statement-breakpoint
CREATE TABLE `Membership` (
	`id` text PRIMARY KEY NOT NULL,
	`userId` text NOT NULL,
	`plan` text NOT NULL,
	`status` text DEFAULT 'incomplete' NOT NULL,
	`provider` text DEFAULT 'stripe' NOT NULL,
	`providerCustomerId` text,
	`providerSubscriptionId` text,
	`providerCheckoutSessionId` text,
	`priceCents` integer NOT NULL,
	`currency` text DEFAULT 'EUR' NOT NULL,
	`currentPeriodStart` integer,
	`currentPeriodEnd` integer,
	`cancelAtPeriodEnd` integer DEFAULT false NOT NULL,
	`startedAt` integer,
	`canceledAt` integer,
	`endedAt` integer,
	`createdAt` integer NOT NULL,
	`updatedAt` integer NOT NULL,
	FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `Membership_userId_unique` ON `Membership` (`userId`);--> statement-breakpoint
CREATE UNIQUE INDEX `Membership_providerSubscriptionId_unique` ON `Membership` (`providerSubscriptionId`);--> statement-breakpoint
CREATE INDEX `membership_status_idx` ON `Membership` (`status`);--> statement-breakpoint
CREATE TABLE `Message` (
	`id` text PRIMARY KEY NOT NULL,
	`conversationId` text NOT NULL,
	`senderId` text NOT NULL,
	`body` text NOT NULL,
	`attachmentUrl` text,
	`attachmentName` text,
	`createdAt` integer NOT NULL,
	`deletedAt` integer,
	FOREIGN KEY (`conversationId`) REFERENCES `Conversation`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`senderId`) REFERENCES `User`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `message_conversation_idx` ON `Message` (`conversationId`,`createdAt`);--> statement-breakpoint
CREATE TABLE `NotificationPreference` (
	`userId` text PRIMARY KEY NOT NULL,
	`emailMessages` integer DEFAULT true NOT NULL,
	`emailConnectionRequests` integer DEFAULT true NOT NULL,
	`emailProductUpdates` integer DEFAULT false NOT NULL,
	`inAppAll` integer DEFAULT true NOT NULL,
	`updatedAt` integer NOT NULL,
	FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `Notification` (
	`id` text PRIMARY KEY NOT NULL,
	`userId` text NOT NULL,
	`type` text NOT NULL,
	`actorId` text,
	`titleKey` text NOT NULL,
	`paramsJson` text DEFAULT '{}' NOT NULL,
	`url` text,
	`entityType` text,
	`entityId` text,
	`dedupeKey` text,
	`readAt` integer,
	`createdAt` integer NOT NULL,
	FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`actorId`) REFERENCES `User`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE UNIQUE INDEX `notification_dedupe_unique` ON `Notification` (`userId`,`dedupeKey`);--> statement-breakpoint
CREATE INDEX `notification_user_idx` ON `Notification` (`userId`,`readAt`);--> statement-breakpoint
CREATE TABLE `OpportunityApplication` (
	`id` text PRIMARY KEY NOT NULL,
	`opportunityId` text NOT NULL,
	`applicantId` text NOT NULL,
	`reason` text NOT NULL,
	`background` text,
	`message` text,
	`status` text DEFAULT 'pending' NOT NULL,
	`createdAt` integer NOT NULL,
	`respondedAt` integer,
	FOREIGN KEY (`opportunityId`) REFERENCES `BusinessOpportunity`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`applicantId`) REFERENCES `User`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `application_unique` ON `OpportunityApplication` (`opportunityId`,`applicantId`);--> statement-breakpoint
CREATE INDEX `application_applicant_idx` ON `OpportunityApplication` (`applicantId`,`status`);--> statement-breakpoint
CREATE TABLE `PerformanceRecord` (
	`id` text PRIMARY KEY NOT NULL,
	`userId` text NOT NULL,
	`kind` text NOT NULL,
	`label` text NOT NULL,
	`labelDe` text,
	`labelEn` text,
	`valueNumber` integer,
	`valueCents` integer,
	`unit` text,
	`verification` text DEFAULT 'self_reported' NOT NULL,
	`visibility` text DEFAULT 'members' NOT NULL,
	`sourceEntityType` text,
	`sourceEntityId` text,
	`isDemo` integer DEFAULT false NOT NULL,
	`createdAt` integer NOT NULL,
	`updatedAt` integer NOT NULL,
	FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `performance_user_idx` ON `PerformanceRecord` (`userId`,`visibility`);--> statement-breakpoint
CREATE TABLE `PlatformMetric` (
	`id` text PRIMARY KEY NOT NULL,
	`key` text NOT NULL,
	`labelDe` text NOT NULL,
	`labelEn` text NOT NULL,
	`valueInt` integer,
	`valueCents` integer,
	`unitDe` text,
	`unitEn` text,
	`kind` text DEFAULT 'zero_state' NOT NULL,
	`category` text NOT NULL,
	`descDe` text,
	`descEn` text,
	`position` integer DEFAULT 0 NOT NULL,
	`updatedAt` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `PlatformMetric_key_unique` ON `PlatformMetric` (`key`);--> statement-breakpoint
CREATE INDEX `metric_category_idx` ON `PlatformMetric` (`category`,`position`);--> statement-breakpoint
CREATE TABLE `Post` (
	`id` text PRIMARY KEY NOT NULL,
	`authorId` text NOT NULL,
	`kind` text DEFAULT 'post' NOT NULL,
	`body` text NOT NULL,
	`imageUrl` text,
	`linkUrl` text,
	`entityType` text,
	`entityId` text,
	`visibility` text DEFAULT 'members' NOT NULL,
	`verified` integer DEFAULT false NOT NULL,
	`isDemo` integer DEFAULT false NOT NULL,
	`createdAt` integer NOT NULL,
	`updatedAt` integer NOT NULL,
	`deletedAt` integer,
	FOREIGN KEY (`authorId`) REFERENCES `User`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `post_author_idx` ON `Post` (`authorId`,`createdAt`);--> statement-breakpoint
CREATE INDEX `post_created_idx` ON `Post` (`createdAt`);--> statement-breakpoint
CREATE TABLE `PrivacySettings` (
	`userId` text PRIMARY KEY NOT NULL,
	`profileVisibility` text DEFAULT 'members' NOT NULL,
	`performanceVisibility` text DEFAULT 'members' NOT NULL,
	`contactVisibility` text DEFAULT 'connections' NOT NULL,
	`showLocation` integer DEFAULT true NOT NULL,
	`discoverable` integer DEFAULT true NOT NULL,
	`allowConnectionRequests` integer DEFAULT true NOT NULL,
	`updatedAt` integer NOT NULL,
	FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `Profile` (
	`id` text PRIMARY KEY NOT NULL,
	`userId` text NOT NULL,
	`headline` text,
	`bio` text,
	`location` text,
	`company` text,
	`jobTitle` text,
	`websiteUrl` text,
	`linkedinUrl` text,
	`xUrl` text,
	`instagramUrl` text,
	`avatarUrl` text,
	`coverUrl` text,
	`rolesJson` text DEFAULT '[]' NOT NULL,
	`skillsJson` text DEFAULT '[]' NOT NULL,
	`lookingForJson` text DEFAULT '[]' NOT NULL,
	`profileVisibility` text DEFAULT 'members' NOT NULL,
	`onboardingCompletedAt` integer,
	`createdAt` integer NOT NULL,
	`updatedAt` integer NOT NULL,
	FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `Profile_userId_unique` ON `Profile` (`userId`);--> statement-breakpoint
CREATE TABLE `RateLimit` (
	`key` text PRIMARY KEY NOT NULL,
	`count` integer DEFAULT 0 NOT NULL,
	`windowStartAt` integer NOT NULL,
	`blockedUntil` integer,
	`updatedAt` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `rate_limit_window_idx` ON `RateLimit` (`windowStartAt`);--> statement-breakpoint
CREATE TABLE `Report` (
	`id` text PRIMARY KEY NOT NULL,
	`reporterId` text NOT NULL,
	`entityType` text NOT NULL,
	`entityId` text NOT NULL,
	`reason` text NOT NULL,
	`details` text,
	`status` text DEFAULT 'open' NOT NULL,
	`reviewerId` text,
	`createdAt` integer NOT NULL,
	`reviewedAt` integer,
	FOREIGN KEY (`reporterId`) REFERENCES `User`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `report_status_idx` ON `Report` (`status`,`createdAt`);--> statement-breakpoint
CREATE TABLE `SellerProfile` (
	`userId` text PRIMARY KEY NOT NULL,
	`status` text DEFAULT 'none' NOT NULL,
	`displayName` text,
	`bio` text,
	`requestedAt` integer,
	`reviewedAt` integer,
	`reviewNote` text,
	FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `Session` (
	`id` text PRIMARY KEY NOT NULL,
	`userId` text NOT NULL,
	`tokenHash` text NOT NULL,
	`userAgent` text,
	`ipHash` text,
	`expiresAt` integer NOT NULL,
	`revokedAt` integer,
	`createdAt` integer NOT NULL,
	FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `Session_tokenHash_unique` ON `Session` (`tokenHash`);--> statement-breakpoint
CREATE INDEX `session_user_idx` ON `Session` (`userId`);--> statement-breakpoint
CREATE INDEX `session_exp_idx` ON `Session` (`expiresAt`);--> statement-breakpoint
CREATE TABLE `Trial` (
	`id` text PRIMARY KEY NOT NULL,
	`userId` text NOT NULL,
	`status` text DEFAULT 'active' NOT NULL,
	`startedAt` integer NOT NULL,
	`expiresAt` integer NOT NULL,
	`convertedAt` integer,
	`connectionRequestsUsed` integer DEFAULT 0 NOT NULL,
	`connectionRequestLimit` integer DEFAULT 3 NOT NULL,
	`fingerprintHash` text,
	`createdAt` integer NOT NULL,
	FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `Trial_userId_unique` ON `Trial` (`userId`);--> statement-breakpoint
CREATE INDEX `trial_exp_idx` ON `Trial` (`expiresAt`);--> statement-breakpoint
CREATE INDEX `trial_fp_idx` ON `Trial` (`fingerprintHash`);--> statement-breakpoint
CREATE TABLE `TrustReview` (
	`id` text PRIMARY KEY NOT NULL,
	`subjectId` text NOT NULL,
	`authorId` text NOT NULL,
	`contextType` text DEFAULT 'connection' NOT NULL,
	`contextId` text,
	`contextLabel` text,
	`rating10` integer NOT NULL,
	`comment` text,
	`status` text DEFAULT 'pending' NOT NULL,
	`verifiedContext` integer DEFAULT false NOT NULL,
	`isDemo` integer DEFAULT false NOT NULL,
	`createdAt` integer NOT NULL,
	FOREIGN KEY (`subjectId`) REFERENCES `User`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`authorId`) REFERENCES `User`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `review_subject_idx` ON `TrustReview` (`subjectId`,`status`);--> statement-breakpoint
CREATE TABLE `TrustScoreSummary` (
	`userId` text PRIMARY KEY NOT NULL,
	`score10` integer,
	`reviewCount` integer DEFAULT 0 NOT NULL,
	`verifiedReviewCount` integer DEFAULT 0 NOT NULL,
	`breakdownJson` text DEFAULT '{}' NOT NULL,
	`updatedAt` integer NOT NULL,
	FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `UserBadge` (
	`id` text PRIMARY KEY NOT NULL,
	`userId` text NOT NULL,
	`badgeId` text NOT NULL,
	`grantedById` text,
	`grantedAt` integer NOT NULL,
	`note` text,
	FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`badgeId`) REFERENCES `Badge`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `user_badge_unique` ON `UserBadge` (`userId`,`badgeId`);--> statement-breakpoint
CREATE TABLE `UserGoal` (
	`id` text PRIMARY KEY NOT NULL,
	`userId` text NOT NULL,
	`goalId` text NOT NULL,
	`createdAt` integer NOT NULL,
	FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`goalId`) REFERENCES `Goal`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `user_goal_unique` ON `UserGoal` (`userId`,`goalId`);--> statement-breakpoint
CREATE INDEX `user_goal_goal_idx` ON `UserGoal` (`goalId`);--> statement-breakpoint
CREATE TABLE `UserInterest` (
	`id` text PRIMARY KEY NOT NULL,
	`userId` text NOT NULL,
	`interestId` text NOT NULL,
	`createdAt` integer NOT NULL,
	FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`interestId`) REFERENCES `Interest`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `user_interest_unique` ON `UserInterest` (`userId`,`interestId`);--> statement-breakpoint
CREATE INDEX `user_interest_interest_idx` ON `UserInterest` (`interestId`);--> statement-breakpoint
CREATE TABLE `User` (
	`id` text PRIMARY KEY NOT NULL,
	`email` text,
	`emailVerifiedAt` integer,
	`phone` text,
	`phoneVerifiedAt` integer,
	`passwordHash` text,
	`firstName` text NOT NULL,
	`lastName` text NOT NULL,
	`handle` text NOT NULL,
	`role` text DEFAULT 'user' NOT NULL,
	`status` text DEFAULT 'active' NOT NULL,
	`ageConfirmedAt` integer,
	`termsAcceptedAt` integer,
	`marketingOptIn` integer DEFAULT false NOT NULL,
	`foundingMember` integer DEFAULT false NOT NULL,
	`foundingMemberAt` integer,
	`countryCode` text,
	`locale` text,
	`isDemo` integer DEFAULT false NOT NULL,
	`seedTag` text,
	`lastLoginAt` integer,
	`createdAt` integer NOT NULL,
	`updatedAt` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `User_email_unique` ON `User` (`email`);--> statement-breakpoint
CREATE UNIQUE INDEX `User_phone_unique` ON `User` (`phone`);--> statement-breakpoint
CREATE UNIQUE INDEX `User_handle_unique` ON `User` (`handle`);--> statement-breakpoint
CREATE INDEX `user_role_idx` ON `User` (`role`);--> statement-breakpoint
CREATE INDEX `user_demo_idx` ON `User` (`isDemo`);--> statement-breakpoint
CREATE TABLE `VerificationCode` (
	`id` text PRIMARY KEY NOT NULL,
	`userId` text NOT NULL,
	`channel` text NOT NULL,
	`purpose` text NOT NULL,
	`target` text NOT NULL,
	`codeHash` text NOT NULL,
	`expiresAt` integer NOT NULL,
	`attempts` integer DEFAULT 0 NOT NULL,
	`maxAttempts` integer DEFAULT 5 NOT NULL,
	`resendCount` integer DEFAULT 0 NOT NULL,
	`consumedAt` integer,
	`createdAt` integer NOT NULL,
	FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `vc_user_idx` ON `VerificationCode` (`userId`,`purpose`,`createdAt`);