ALTER TABLE `BadgeApplication` ADD `identityConfirmedAt` integer;--> statement-breakpoint
ALTER TABLE `User` ADD `foundingMemberNumber` integer;--> statement-breakpoint
ALTER TABLE `User` ADD `suspensionEndsAt` integer;--> statement-breakpoint
ALTER TABLE `User` ADD `suspensionReason` text;--> statement-breakpoint
CREATE UNIQUE INDEX `user_founding_number_unique` ON `User` (`foundingMemberNumber`);--> statement-breakpoint
/* Reserve stable ordinals for the first fifty real account records only.
   This does not grant the Founding Member flag or create a UserBadge row;
   administration still has to explicitly grant the permanent honour. Existing
   flags are preserved, but an out-of-cohort legacy flag remains unnumbered and
   is not eligible for public display. */
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
