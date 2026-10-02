ALTER TABLE `BadgeApplication` ADD `identityConfirmedAt` integer;--> statement-breakpoint
ALTER TABLE `User` ADD `foundingMemberNumber` integer;--> statement-breakpoint
ALTER TABLE `User` ADD `suspensionEndsAt` integer;--> statement-breakpoint
ALTER TABLE `User` ADD `suspensionReason` text;--> statement-breakpoint
CREATE UNIQUE INDEX `user_founding_number_unique` ON `User` (`foundingMemberNumber`);--> statement-breakpoint
WITH ranked_accounts AS (
  SELECT `id`, ROW_NUMBER() OVER (ORDER BY `createdAt`, `id`) AS `member_number`
  FROM `User`
  WHERE `isDemo` = 0
)
UPDATE `User`
SET `foundingMemberNumber` = (
  SELECT `member_number` FROM ranked_accounts WHERE ranked_accounts.`id` = `User`.`id`
)
WHERE `isDemo` = 0
  AND `foundingMemberNumber` IS NULL
  AND (
    SELECT `member_number` FROM ranked_accounts WHERE ranked_accounts.`id` = `User`.`id`
  ) BETWEEN 1 AND 50;
