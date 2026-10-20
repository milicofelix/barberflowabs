CREATE TABLE `denuncias_perfil_publico` (
  `id` INTEGER NOT NULL AUTO_INCREMENT,
  `barbeariaId` INTEGER NOT NULL,
  `nome` VARCHAR(191) NULL,
  `email` VARCHAR(191) NULL,
  `motivo` VARCHAR(191) NOT NULL,
  `mensagem` TEXT NOT NULL,
  `status` VARCHAR(191) NOT NULL DEFAULT 'PENDENTE',
  `resolucao` TEXT NULL,
  `revisadoPorId` INTEGER NULL,
  `revisadoEm` DATETIME(3) NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  INDEX `denuncias_perfil_publico_barbeariaId_status_createdAt_idx`(`barbeariaId`, `status`, `createdAt`),
  INDEX `denuncias_perfil_publico_revisadoPorId_idx`(`revisadoPorId`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `denuncias_perfil_publico`
  ADD CONSTRAINT `denuncias_perfil_publico_barbeariaId_fkey`
  FOREIGN KEY (`barbeariaId`) REFERENCES `barbearias`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE `denuncias_perfil_publico`
  ADD CONSTRAINT `denuncias_perfil_publico_revisadoPorId_fkey`
  FOREIGN KEY (`revisadoPorId`) REFERENCES `usuarios`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
