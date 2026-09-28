ALTER TABLE `TrustReview` ADD `moderatedById` text REFERENCES User(id);--> statement-breakpoint
ALTER TABLE `TrustReview` ADD `moderatedAt` integer;--> statement-breakpoint
ALTER TABLE `TrustReview` ADD `moderationNote` text;--> statement-breakpoint
CREATE INDEX `review_author_idx` ON `TrustReview` (`authorId`);--> statement-breakpoint
CREATE UNIQUE INDEX `trust_review_basis_unique` ON `TrustReview` (`subjectId`,`authorId`,`contextType`,`contextId`);