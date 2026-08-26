ALTER TABLE `barbearias`
  ADD COLUMN `reviewStatus` VARCHAR(191) NOT NULL DEFAULT 'APPROVED',
  ADD COLUMN `approvedAt` DATETIME(3) NULL,
  ADD COLUMN `approvedById` INTEGER NULL,
  ADD COLUMN `rejectedAt` DATETIME(3) NULL,
  ADD COLUMN `rejectedById` INTEGER NULL,
  ADD COLUMN `reviewReason` TEXT NULL;

UPDATE `barbearias`
SET `reviewStatus` = 'APPROVED',
    `approvedAt` = COALESCE(`approvedAt`, CURRENT_TIMESTAMP(3))
WHERE `reviewStatus` = 'APPROVED';
