-- AlterTable
ALTER TABLE `ConfLsuicLeaderLink` ADD COLUMN `includeAddressPage` BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE `ConfLsuicLeaderLink` ADD COLUMN `addressText` TEXT NULL;
