ALTER TABLE `envios_comunicacao`
  ADD COLUMN `chaveIdempotencia` VARCHAR(191) NULL,
  ADD COLUMN `bloqueadoEm` DATETIME(3) NULL,
  ADD COLUMN `bloqueadoPor` VARCHAR(191) NULL,
  ADD COLUMN `provedor` VARCHAR(191) NULL,
  ADD COLUMN `referenciaExterna` VARCHAR(191) NULL;

CREATE UNIQUE INDEX `envios_comunicacao_estabelecimentoId_chaveIdempotencia_key`
  ON `envios_comunicacao`(`estabelecimentoId`, `chaveIdempotencia`);
CREATE INDEX `envios_comunicacao_status_proximaTentativaEm_bloqueadoEm_idx`
  ON `envios_comunicacao`(`status`, `proximaTentativaEm`, `bloqueadoEm`);
CREATE INDEX `envios_comunicacao_provedor_referenciaExterna_idx`
  ON `envios_comunicacao`(`provedor`, `referenciaExterna`);

CREATE TABLE `callbacks_envios_comunicacao` (
  `id` INTEGER NOT NULL AUTO_INCREMENT,
  `envioId` INTEGER NULL,
  `provedor` VARCHAR(191) NOT NULL,
  `eventoExternoId` VARCHAR(191) NOT NULL,
  `referenciaExterna` VARCHAR(191) NULL,
  `tipo` VARCHAR(191) NOT NULL,
  `payload` JSON NOT NULL,
  `recebidoEm` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `processadoEm` DATETIME(3) NULL,
  `erro` TEXT NULL,
  UNIQUE INDEX `callbacks_envios_comunicacao_provedor_eventoExternoId_key` (`provedor`, `eventoExternoId`),
  INDEX `callbacks_envios_comunicacao_referenciaExterna_idx` (`referenciaExterna`),
  INDEX `callbacks_envios_comunicacao_processadoEm_recebidoEm_idx` (`processadoEm`, `recebidoEm`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `callbacks_envios_comunicacao`
  ADD CONSTRAINT `callbacks_envios_comunicacao_envioId_fkey`
  FOREIGN KEY (`envioId`) REFERENCES `envios_comunicacao`(`id`)
  ON DELETE SET NULL ON UPDATE CASCADE;
