-- Split Financial Secretary (FINANCIAL_SECRETARY) from National Treasurer (TREASURER)
-- and add delegate FS / Treasurer acknowledgement columns.
-- Review before applying on production; prefer `npx prisma migrate dev` when possible.

-- 1) Extend ConfRole enum on committee tables (MySQL native ENUM on columns).
ALTER TABLE `ConfMember`
  MODIFY COLUMN `role` ENUM(
    'CHAIR',
    'VICE_CHAIR',
    'SECRETARY',
    'FINANCIAL_SECRETARY',
    'TREASURER',
    'COMMITTEE',
    'DELEGATE'
  ) NOT NULL;

ALTER TABLE `ConfCommitteeRole`
  MODIFY COLUMN `baseRole` ENUM(
    'CHAIR',
    'VICE_CHAIR',
    'SECRETARY',
    'FINANCIAL_SECRETARY',
    'TREASURER',
    'COMMITTEE',
    'DELEGATE'
  ) NOT NULL;

-- 2) Migrate legacy data: old TREASURER conference role = National Financial Secretary.
UPDATE `ConfMember` SET `role` = 'FINANCIAL_SECRETARY' WHERE `role` = 'TREASURER';

UPDATE `ConfCommitteeRole`
SET `baseRole` = 'FINANCIAL_SECRETARY'
WHERE `key` = 'CONFERENCE_TREASURER' AND `baseRole` = 'TREASURER';

-- 3) Delegate finance gate + treasurer acknowledgement
ALTER TABLE `ConfDelegate`
  ADD COLUMN `feeFsApprovedAt` DATETIME(3) NULL,
  ADD COLUMN `feeFsApprovedBy` VARCHAR(191) NULL,
  ADD COLUMN `feeTreasurerAckAt` DATETIME(3) NULL,
  ADD COLUMN `feeTreasurerAckBy` VARCHAR(191) NULL;

CREATE INDEX `ConfDelegate_confId_feeFsApprovedAt_idx` ON `ConfDelegate`(`confId`, `feeFsApprovedAt`);

-- 4) Backfill: previously fully paid delegates appear on Treasurer queue
UPDATE `ConfDelegate`
SET `feeFsApprovedAt` = `updatedAt`, `feeFsApprovedBy` = NULL
WHERE `feePaid` = 1
  AND `amountPaid` >= COALESCE(`feeAmount`, 0)
  AND `status` <> 'CANCELLED';
