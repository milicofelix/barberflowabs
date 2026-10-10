CREATE TABLE `membros_equipe` (
  `id` INTEGER NOT NULL AUTO_INCREMENT,
  `barbeariaId` INTEGER NOT NULL,
  `usuarioId` INTEGER NOT NULL,
  `profissionalId` INTEGER NULL,
  `papel` VARCHAR(191) NOT NULL DEFAULT 'PROFISSIONAL',
  `permissoes` JSON NOT NULL,
  `ativo` BOOLEAN NOT NULL DEFAULT true,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL,
  UNIQUE INDEX `membros_equipe_profissionalId_key`(`profissionalId`),
  UNIQUE INDEX `membros_equipe_barbeariaId_usuarioId_key`(`barbeariaId`, `usuarioId`),
  INDEX `membros_equipe_barbeariaId_ativo_idx`(`barbeariaId`, `ativo`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `escalas_profissionais` (
  `id` INTEGER NOT NULL AUTO_INCREMENT,
  `barbeariaId` INTEGER NOT NULL,
  `profissionalId` INTEGER NOT NULL,
  `unidadeId` INTEGER NULL,
  `diaSemana` INTEGER NOT NULL,
  `inicio` VARCHAR(5) NOT NULL,
  `fim` VARCHAR(5) NOT NULL,
  `intervaloInicio` VARCHAR(5) NULL,
  `intervaloFim` VARCHAR(5) NULL,
  `ativo` BOOLEAN NOT NULL DEFAULT true,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL,
  INDEX `escalas_profissionais_barbeariaId_diaSemana_ativo_idx`(`barbeariaId`, `diaSemana`, `ativo`),
  INDEX `escalas_profissionais_profissionalId_diaSemana_ativo_idx`(`profissionalId`, `diaSemana`, `ativo`),
  INDEX `escalas_profissionais_unidadeId_idx`(`unidadeId`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `indisponibilidades_recursos` (
  `id` INTEGER NOT NULL AUTO_INCREMENT,
  `barbeariaId` INTEGER NOT NULL,
  `recursoId` INTEGER NOT NULL,
  `inicio` DATETIME(3) NOT NULL,
  `fim` DATETIME(3) NOT NULL,
  `motivo` TEXT NULL,
  `ativo` BOOLEAN NOT NULL DEFAULT true,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL,
  INDEX `indisponibilidades_recursos_barbeariaId_inicio_fim_idx`(`barbeariaId`, `inicio`, `fim`),
  INDEX `indisponibilidades_recursos_recursoId_inicio_fim_ativo_idx`(`recursoId`, `inicio`, `fim`, `ativo`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `membros_equipe` ADD CONSTRAINT `membros_equipe_barbeariaId_fkey` FOREIGN KEY (`barbeariaId`) REFERENCES `barbearias`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `membros_equipe` ADD CONSTRAINT `membros_equipe_usuarioId_fkey` FOREIGN KEY (`usuarioId`) REFERENCES `usuarios`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `membros_equipe` ADD CONSTRAINT `membros_equipe_profissionalId_fkey` FOREIGN KEY (`profissionalId`) REFERENCES `profissionais`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE `escalas_profissionais` ADD CONSTRAINT `escalas_profissionais_barbeariaId_fkey` FOREIGN KEY (`barbeariaId`) REFERENCES `barbearias`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `escalas_profissionais` ADD CONSTRAINT `escalas_profissionais_profissionalId_fkey` FOREIGN KEY (`profissionalId`) REFERENCES `profissionais`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `escalas_profissionais` ADD CONSTRAINT `escalas_profissionais_unidadeId_fkey` FOREIGN KEY (`unidadeId`) REFERENCES `unidades`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE `indisponibilidades_recursos` ADD CONSTRAINT `indisponibilidades_recursos_barbeariaId_fkey` FOREIGN KEY (`barbeariaId`) REFERENCES `barbearias`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `indisponibilidades_recursos` ADD CONSTRAINT `indisponibilidades_recursos_recursoId_fkey` FOREIGN KEY (`recursoId`) REFERENCES `recursos`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
