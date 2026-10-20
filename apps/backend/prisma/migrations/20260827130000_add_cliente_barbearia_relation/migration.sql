CREATE TABLE `clientes_barbearias` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `barbeariaId` INTEGER NOT NULL,
    `usuarioId` INTEGER NOT NULL,
    `origem` VARCHAR(191) NOT NULL DEFAULT 'AGENDAMENTO',
    `primeiroAgendamentoEm` DATETIME(3) NULL,
    `ultimoAgendamentoEm` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `clientes_barbearias_barbeariaId_usuarioId_key`(`barbeariaId`, `usuarioId`),
    INDEX `clientes_barbearias_usuarioId_idx`(`usuarioId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

INSERT INTO `clientes_barbearias` (
    `barbeariaId`,
    `usuarioId`,
    `origem`,
    `primeiroAgendamentoEm`,
    `ultimoAgendamentoEm`,
    `createdAt`,
    `updatedAt`
)
SELECT
    `agendamentos`.`barbeariaId`,
    `agendamentos`.`usuarioId`,
    'AGENDAMENTO',
    MIN(`agendamentos`.`data`),
    MAX(`agendamentos`.`data`),
    CURRENT_TIMESTAMP(3),
    CURRENT_TIMESTAMP(3)
FROM `agendamentos`
GROUP BY `agendamentos`.`barbeariaId`, `agendamentos`.`usuarioId`;

ALTER TABLE `clientes_barbearias`
    ADD CONSTRAINT `clientes_barbearias_barbeariaId_fkey`
    FOREIGN KEY (`barbeariaId`) REFERENCES `barbearias`(`id`)
    ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE `clientes_barbearias`
    ADD CONSTRAINT `clientes_barbearias_usuarioId_fkey`
    FOREIGN KEY (`usuarioId`) REFERENCES `usuarios`(`id`)
    ON DELETE RESTRICT ON UPDATE CASCADE;
