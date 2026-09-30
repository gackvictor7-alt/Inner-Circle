ALTER TABLE `Message` ADD `readAt` integer;
--> statement-breakpoint
UPDATE `Message`
SET `readAt` = (
  SELECT MAX(`ConversationParticipant`.`lastReadAt`)
  FROM `ConversationParticipant`
  WHERE `ConversationParticipant`.`conversationId` = `Message`.`conversationId`
    AND `ConversationParticipant`.`userId` <> `Message`.`senderId`
    AND `ConversationParticipant`.`lastReadAt` >= `Message`.`createdAt`
)
WHERE `Message`.`deletedAt` IS NULL
  AND EXISTS (
    SELECT 1
    FROM `ConversationParticipant`
    WHERE `ConversationParticipant`.`conversationId` = `Message`.`conversationId`
      AND `ConversationParticipant`.`userId` <> `Message`.`senderId`
      AND `ConversationParticipant`.`lastReadAt` >= `Message`.`createdAt`
  );
