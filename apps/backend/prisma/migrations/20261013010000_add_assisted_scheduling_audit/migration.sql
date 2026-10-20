ALTER TABLE `agendamentos`
    ADD COLUMN `criadoPorId` INTEGER NULL,
    ADD COLUMN `origem` VARCHAR(191) NOT NULL DEFAULT 'APP_CLIENTE',
    ADD COLUMN `observacoes` TEXT NULL;

CREATE INDEX `agendamentos_criadoPorId_idx` ON `agendamentos`(`criadoPorId`);

ALTER TABLE `agendamentos`
    ADD CONSTRAINT `agendamentos_criadoPorId_fkey`
    FOREIGN KEY (`criadoPorId`) REFERENCES `usuarios`(`id`)
    ON DELETE SET NULL ON UPDATE CASCADE;
