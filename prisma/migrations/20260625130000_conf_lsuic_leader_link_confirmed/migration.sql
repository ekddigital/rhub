-- AlterTable
ALTER TABLE `ConfLsuicLeaderLink` ADD COLUMN `confirmed` BOOLEAN NOT NULL DEFAULT false;

-- Existing manual links are already trusted; auto links need user confirmation.
UPDATE `ConfLsuicLeaderLink` SET `confirmed` = true WHERE `linkSource` = 'MANUAL';
