ALTER TABLE `barbearias`
  ADD COLUMN `comercialStatus` VARCHAR(191) NOT NULL DEFAULT 'NOVO',
  ADD COLUMN `notasInternas` TEXT NULL,
  ADD COLUMN `ultimoContatoEm` DATETIME(3) NULL,
  ADD COLUMN `proximoContatoEm` DATETIME(3) NULL;

CREATE INDEX `barbearias_comercialStatus_idx` ON `barbearias`(`comercialStatus`);
CREATE INDEX `barbearias_proximoContatoEm_idx` ON `barbearias`(`proximoContatoEm`);
