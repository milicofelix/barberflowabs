ALTER TABLE `usuarios` ADD COLUMN `fotoURL` VARCHAR(191) NULL;
CREATE TABLE `midias` (
  `id` VARCHAR(191) NOT NULL,
  `chaveCatalogo` VARCHAR(191) NULL,
  `titulo` VARCHAR(191) NOT NULL,
  `escopo` VARCHAR(191) NOT NULL,
  `finalidade` VARCHAR(191) NOT NULL,
  `segmentoSlug` VARCHAR(191) NULL,
  `usuarioId` INTEGER NULL,
  `estabelecimentoId` INTEGER NULL,
  `arquivoOrigem` VARCHAR(191) NULL,
  `versoes` JSON NOT NULL,
  `ativo` BOOLEAN NOT NULL DEFAULT true,
  `status` VARCHAR(191) NOT NULL DEFAULT 'DISPONIVEL',
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE INDEX `midias_chaveCatalogo_key` (`chaveCatalogo`),
  INDEX `midias_escopo_finalidade_ativo_idx` (`escopo`, `finalidade`, `ativo`),
  INDEX `midias_estabelecimentoId_idx` (`estabelecimentoId`),
  INDEX `midias_usuarioId_idx` (`usuarioId`),
  CONSTRAINT `midias_usuarioId_fkey` FOREIGN KEY (`usuarioId`) REFERENCES `usuarios` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `midias_estabelecimentoId_fkey` FOREIGN KEY (`estabelecimentoId`) REFERENCES `estabelecimentos` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE TABLE `midias_vinculos` (
  `id` INTEGER NOT NULL AUTO_INCREMENT,
  `midiaId` VARCHAR(191) NOT NULL,
  `entidade` VARCHAR(191) NOT NULL,
  `entidadeId` INTEGER NOT NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE INDEX `midias_vinculos_entidade_entidadeId_key` (`entidade`, `entidadeId`),
  INDEX `midias_vinculos_midiaId_idx` (`midiaId`),
  CONSTRAINT `midias_vinculos_midiaId_fkey` FOREIGN KEY (`midiaId`) REFERENCES `midias` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
