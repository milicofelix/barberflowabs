-- CreateTable
CREATE TABLE `barbearias` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `nome` VARCHAR(191) NOT NULL,
    `slug` VARCHAR(191) NOT NULL,
    `telefone` VARCHAR(191) NULL,
    `email` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `barbearias_slug_key`(`slug`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Seed default tenant before existing rows receive the required FK.
INSERT INTO `barbearias` (`id`, `nome`, `slug`, `telefone`, `email`)
VALUES (1, 'Barba Brutal', 'barba-brutal', '(11) 99999-9999', 'contato@barbabrutal.app')
ON DUPLICATE KEY UPDATE `nome` = `nome`;

-- CreateTable
CREATE TABLE `unidades` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `barbeariaId` INTEGER NOT NULL,
    `nome` VARCHAR(191) NOT NULL,
    `endereco` VARCHAR(191) NULL,
    `telefone` VARCHAR(191) NULL,
    `ativa` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `unidades_barbeariaId_nome_key`(`barbeariaId`, `nome`),
    INDEX `unidades_barbeariaId_idx`(`barbeariaId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

INSERT INTO `unidades` (`barbeariaId`, `nome`, `endereco`, `telefone`)
VALUES (1, 'Unidade Principal', 'Rua Principal, 100', '(11) 99999-9999')
ON DUPLICATE KEY UPDATE `nome` = `nome`;

-- AlterTable
ALTER TABLE `usuarios` ADD COLUMN `barbeariaId` INTEGER NOT NULL DEFAULT 1;

-- AlterTable
ALTER TABLE `profissionais` ADD COLUMN `barbeariaId` INTEGER NOT NULL DEFAULT 1;

-- AlterTable
ALTER TABLE `servicos` ADD COLUMN `barbeariaId` INTEGER NOT NULL DEFAULT 1;

-- AlterTable
ALTER TABLE `agendamentos` ADD COLUMN `barbeariaId` INTEGER NOT NULL DEFAULT 1;

-- Replace global name uniqueness with tenant-scoped uniqueness.
DROP INDEX `profissionais_nome_key` ON `profissionais`;
DROP INDEX `servicos_nome_key` ON `servicos`;

-- CreateIndex
CREATE INDEX `usuarios_barbeariaId_idx` ON `usuarios`(`barbeariaId`);

-- CreateIndex
CREATE UNIQUE INDEX `profissionais_barbeariaId_nome_key` ON `profissionais`(`barbeariaId`, `nome`);

-- CreateIndex
CREATE INDEX `profissionais_barbeariaId_idx` ON `profissionais`(`barbeariaId`);

-- CreateIndex
CREATE UNIQUE INDEX `servicos_barbeariaId_nome_key` ON `servicos`(`barbeariaId`, `nome`);

-- CreateIndex
CREATE INDEX `servicos_barbeariaId_idx` ON `servicos`(`barbeariaId`);

-- CreateIndex
CREATE INDEX `agendamentos_barbeariaId_idx` ON `agendamentos`(`barbeariaId`);

-- CreateIndex
CREATE INDEX `agendamentos_profissionalId_data_idx` ON `agendamentos`(`profissionalId`, `data`);

-- AddForeignKey
ALTER TABLE `unidades` ADD CONSTRAINT `unidades_barbeariaId_fkey` FOREIGN KEY (`barbeariaId`) REFERENCES `barbearias`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `usuarios` ADD CONSTRAINT `usuarios_barbeariaId_fkey` FOREIGN KEY (`barbeariaId`) REFERENCES `barbearias`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `profissionais` ADD CONSTRAINT `profissionais_barbeariaId_fkey` FOREIGN KEY (`barbeariaId`) REFERENCES `barbearias`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `servicos` ADD CONSTRAINT `servicos_barbeariaId_fkey` FOREIGN KEY (`barbeariaId`) REFERENCES `barbearias`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `agendamentos` ADD CONSTRAINT `agendamentos_barbeariaId_fkey` FOREIGN KEY (`barbeariaId`) REFERENCES `barbearias`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
