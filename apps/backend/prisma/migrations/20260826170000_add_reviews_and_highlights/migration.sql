CREATE TABLE `avaliacoes` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `barbeariaId` INTEGER NOT NULL,
    `agendamentoId` INTEGER NOT NULL,
    `usuarioId` INTEGER NOT NULL,
    `profissionalId` INTEGER NOT NULL,
    `nota` INTEGER NOT NULL,
    `comentario` TEXT NULL,
    `status` VARCHAR(191) NOT NULL DEFAULT 'APPROVED',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `avaliacoes_agendamentoId_key`(`agendamentoId`),
    INDEX `avaliacoes_barbeariaId_status_idx`(`barbeariaId`, `status`),
    INDEX `avaliacoes_profissionalId_status_idx`(`profissionalId`, `status`),
    INDEX `avaliacoes_usuarioId_idx`(`usuarioId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `avaliacoes`
    ADD CONSTRAINT `avaliacoes_barbeariaId_fkey`
    FOREIGN KEY (`barbeariaId`) REFERENCES `barbearias`(`id`)
    ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE `avaliacoes`
    ADD CONSTRAINT `avaliacoes_agendamentoId_fkey`
    FOREIGN KEY (`agendamentoId`) REFERENCES `agendamentos`(`id`)
    ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE `avaliacoes`
    ADD CONSTRAINT `avaliacoes_usuarioId_fkey`
    FOREIGN KEY (`usuarioId`) REFERENCES `usuarios`(`id`)
    ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE `avaliacoes`
    ADD CONSTRAINT `avaliacoes_profissionalId_fkey`
    FOREIGN KEY (`profissionalId`) REFERENCES `profissionais`(`id`)
    ON DELETE RESTRICT ON UPDATE CASCADE;
