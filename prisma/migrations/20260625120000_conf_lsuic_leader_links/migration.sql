-- CreateTable
CREATE TABLE `ConfLsuicLeaderLink` (
    `id` VARCHAR(191) NOT NULL,
    `confId` VARCHAR(191) NOT NULL,
    `rosterKey` VARCHAR(191) NOT NULL,
    `delegateId` VARCHAR(191) NULL,
    `userId` VARCHAR(191) NULL,
    `linkSource` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `ConfLsuicLeaderLink_confId_rosterKey_key`(`confId`, `rosterKey`),
    INDEX `ConfLsuicLeaderLink_confId_idx`(`confId`),
    INDEX `ConfLsuicLeaderLink_delegateId_idx`(`delegateId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `ConfLsuicLeaderLink` ADD CONSTRAINT `ConfLsuicLeaderLink_confId_fkey` FOREIGN KEY (`confId`) REFERENCES `ConfEvent`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ConfLsuicLeaderLink` ADD CONSTRAINT `ConfLsuicLeaderLink_delegateId_fkey` FOREIGN KEY (`delegateId`) REFERENCES `ConfDelegate`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
