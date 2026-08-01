-- CreateTable
CREATE TABLE `ConfPaymentLineItem` (
    `id` VARCHAR(191) NOT NULL,
    `paymentId` VARCHAR(191) NOT NULL,
    `no` INTEGER NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `qty` DOUBLE NOT NULL,
    `unit` VARCHAR(191) NOT NULL,
    `unitPrice` DOUBLE NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `ConfPaymentLineItem_paymentId_idx`(`paymentId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AlterTable
ALTER TABLE `ConfPaymentProof`
    ADD COLUMN `lineItemId` VARCHAR(191) NULL;

-- CreateIndex
CREATE INDEX `ConfPaymentProof_lineItemId_idx` ON `ConfPaymentProof`(`lineItemId`);

-- AddForeignKey
ALTER TABLE `ConfPaymentLineItem` ADD CONSTRAINT `ConfPaymentLineItem_paymentId_fkey` FOREIGN KEY (`paymentId`) REFERENCES `ConfPayment`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ConfPaymentProof` ADD CONSTRAINT `ConfPaymentProof_lineItemId_fkey` FOREIGN KEY (`lineItemId`) REFERENCES `ConfPaymentLineItem`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
