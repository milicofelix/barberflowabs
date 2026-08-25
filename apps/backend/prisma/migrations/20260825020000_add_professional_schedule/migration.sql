-- CreateTable
CREATE TABLE `horarios_funcionamento` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `barbeariaId` INTEGER NOT NULL,
    `unidadeId` INTEGER NULL,
    `diaSemana` INTEGER NOT NULL,
    `inicio` VARCHAR(5) NOT NULL,
    `fim` VARCHAR(5) NOT NULL,
    `intervaloInicio` VARCHAR(5) NULL,
    `intervaloFim` VARCHAR(5) NULL,
    `ativo` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),

    INDEX `horarios_funcionamento_barbeariaId_diaSemana_idx`(`barbeariaId`, `diaSemana`),
    INDEX `horarios_funcionamento_unidadeId_idx`(`unidadeId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `bloqueios_agenda` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `barbeariaId` INTEGER NOT NULL,
    `profissionalId` INTEGER NULL,
    `unidadeId` INTEGER NULL,
    `inicio` DATETIME(3) NOT NULL,
    `fim` DATETIME(3) NOT NULL,
    `motivo` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),

    INDEX `bloqueios_agenda_barbeariaId_inicio_fim_idx`(`barbeariaId`, `inicio`, `fim`),
    INDEX `bloqueios_agenda_profissionalId_inicio_fim_idx`(`profissionalId`, `inicio`, `fim`),
    INDEX `bloqueios_agenda_unidadeId_inicio_fim_idx`(`unidadeId`, `inicio`, `fim`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Seed default weekly schedule compatible with the current static calendar.
INSERT INTO `horarios_funcionamento`
    (`barbeariaId`, `diaSemana`, `inicio`, `fim`, `intervaloInicio`, `intervaloFim`, `ativo`)
VALUES
    (1, 1, '08:00', '21:00', '12:00', '13:00', true),
    (1, 2, '08:00', '21:00', '12:00', '13:00', true),
    (1, 3, '08:00', '21:00', '12:00', '13:00', true),
    (1, 4, '08:00', '21:00', '12:00', '13:00', true),
    (1, 5, '08:00', '21:00', '12:00', '13:00', true),
    (1, 6, '08:00', '21:00', '12:00', '13:00', true);

-- AddForeignKey
ALTER TABLE `horarios_funcionamento` ADD CONSTRAINT `horarios_funcionamento_barbeariaId_fkey` FOREIGN KEY (`barbeariaId`) REFERENCES `barbearias`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `horarios_funcionamento` ADD CONSTRAINT `horarios_funcionamento_unidadeId_fkey` FOREIGN KEY (`unidadeId`) REFERENCES `unidades`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `bloqueios_agenda` ADD CONSTRAINT `bloqueios_agenda_barbeariaId_fkey` FOREIGN KEY (`barbeariaId`) REFERENCES `barbearias`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `bloqueios_agenda` ADD CONSTRAINT `bloqueios_agenda_profissionalId_fkey` FOREIGN KEY (`profissionalId`) REFERENCES `profissionais`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `bloqueios_agenda` ADD CONSTRAINT `bloqueios_agenda_unidadeId_fkey` FOREIGN KEY (`unidadeId`) REFERENCES `unidades`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
