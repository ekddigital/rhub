-- AlterTable
ALTER TABLE `ConfBudget`
    ADD COLUMN `isLocked` BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN `editUnlockStatus` ENUM('NONE', 'PENDING', 'GRANTED') NOT NULL DEFAULT 'NONE',
    ADD COLUMN `editUnlockRequestedAt` DATETIME(3) NULL,
    ADD COLUMN `editUnlockRequestNote` TEXT NULL,
    ADD COLUMN `editUnlockedAt` DATETIME(3) NULL,
    ADD COLUMN `editUnlockedBy` VARCHAR(191) NULL;

-- CreateIndex
CREATE INDEX `ConfBudget_isLocked_idx` ON `ConfBudget`(`isLocked`);
CREATE INDEX `ConfBudget_editUnlockStatus_idx` ON `ConfBudget`(`editUnlockStatus`);

-- Backfill: approved budgets are locked
UPDATE `ConfBudget` SET `isLocked` = true WHERE `status` = 'APPROVED';
