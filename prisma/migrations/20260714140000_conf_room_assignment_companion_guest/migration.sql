-- AlterTable
ALTER TABLE `ConfRoomAssignment` ADD COLUMN `companionGuestId` VARCHAR(191) NULL;

-- CreateIndex
CREATE INDEX `ConfRoomAssignment_companionGuestId_idx` ON `ConfRoomAssignment`(`companionGuestId`);

-- AddForeignKey
ALTER TABLE `ConfRoomAssignment` ADD CONSTRAINT `ConfRoomAssignment_companionGuestId_fkey` FOREIGN KEY (`companionGuestId`) REFERENCES `ConfDelegateGuest`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
