ALTER TABLE `usuarios`
  ADD COLUMN `dataNascimento` DATETIME(3) NULL;

CREATE TABLE `lembretes_relacionamento` (
  `id` INTEGER NOT NULL AUTO_INCREMENT,
  `barbeariaId` INTEGER NOT NULL,
  `usuarioId` INTEGER NULL,
  `agendamentoId` INTEGER NULL,
  `tipo` VARCHAR(191) NOT NULL,
  `canal` VARCHAR(191) NOT NULL DEFAULT 'WHATSAPP',
  `status` VARCHAR(191) NOT NULL DEFAULT 'PENDENTE',
  `mensagem` TEXT NOT NULL,
  `dataPrevista` DATETIME(3) NOT NULL,
  `enviadoEm` DATETIME(3) NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  INDEX `lembretes_relacionamento_barbeariaId_status_dataPrevista_idx`(`barbeariaId`, `status`, `dataPrevista`),
  INDEX `lembretes_relacionamento_usuarioId_idx`(`usuarioId`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `lembretes_relacionamento`
  ADD CONSTRAINT `lembretes_relacionamento_barbeariaId_fkey`
  FOREIGN KEY (`barbeariaId`) REFERENCES `barbearias`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE `lembretes_relacionamento`
  ADD CONSTRAINT `lembretes_relacionamento_usuarioId_fkey`
  FOREIGN KEY (`usuarioId`) REFERENCES `usuarios`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
