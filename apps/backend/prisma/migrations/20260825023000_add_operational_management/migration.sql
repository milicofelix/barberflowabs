ALTER TABLE `agendamentos`
  ADD COLUMN `status` VARCHAR(191) NOT NULL DEFAULT 'AGENDADO',
  ADD COLUMN `valorTotal` DECIMAL(10, 2) NOT NULL DEFAULT 0,
  ADD COLUMN `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  ADD COLUMN `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3);

CREATE TABLE `lancamentos_financeiros` (
  `id` INTEGER NOT NULL AUTO_INCREMENT,
  `barbeariaId` INTEGER NOT NULL,
  `profissionalId` INTEGER NULL,
  `usuarioId` INTEGER NULL,
  `tipo` VARCHAR(191) NOT NULL,
  `categoria` VARCHAR(191) NULL,
  `descricao` VARCHAR(191) NOT NULL,
  `valor` DECIMAL(10, 2) NOT NULL,
  `data` DATETIME(3) NOT NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),

  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE INDEX `lancamentos_financeiros_barbeariaId_data_idx` ON `lancamentos_financeiros`(`barbeariaId`, `data`);
CREATE INDEX `lancamentos_financeiros_profissionalId_data_idx` ON `lancamentos_financeiros`(`profissionalId`, `data`);
CREATE INDEX `lancamentos_financeiros_usuarioId_idx` ON `lancamentos_financeiros`(`usuarioId`);

ALTER TABLE `lancamentos_financeiros`
  ADD CONSTRAINT `lancamentos_financeiros_barbeariaId_fkey`
  FOREIGN KEY (`barbeariaId`) REFERENCES `barbearias`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE `lancamentos_financeiros`
  ADD CONSTRAINT `lancamentos_financeiros_profissionalId_fkey`
  FOREIGN KEY (`profissionalId`) REFERENCES `profissionais`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE `lancamentos_financeiros`
  ADD CONSTRAINT `lancamentos_financeiros_usuarioId_fkey`
  FOREIGN KEY (`usuarioId`) REFERENCES `usuarios`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
