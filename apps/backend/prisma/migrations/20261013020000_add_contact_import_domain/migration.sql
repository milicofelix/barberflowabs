ALTER TABLE `usuarios`
    ADD COLUMN `emailContato` VARCHAR(191) NULL,
    ADD COLUMN `emailTecnico` BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN `telefoneNormalizado` VARCHAR(191) NULL;

CREATE INDEX `usuarios_telefoneNormalizado_idx` ON `usuarios`(`telefoneNormalizado`);

CREATE TABLE `importacoes_contatos_lotes` (
    `id` VARCHAR(191) NOT NULL,
    `estabelecimentoId` INTEGER NOT NULL,
    `operadorId` INTEGER NOT NULL,
    `chaveIdempotencia` VARCHAR(191) NOT NULL,
    `status` VARCHAR(191) NOT NULL DEFAULT 'SIMULADO',
    `totalRecebidos` INTEGER NOT NULL DEFAULT 0,
    `totalNovos` INTEGER NOT NULL DEFAULT 0,
    `totalExistentes` INTEGER NOT NULL DEFAULT 0,
    `totalInvalidos` INTEGER NOT NULL DEFAULT 0,
    `totalConflitos` INTEGER NOT NULL DEFAULT 0,
    `totalImportados` INTEGER NOT NULL DEFAULT 0,
    `confirmadoEm` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    UNIQUE INDEX `import_contatos_lote_tenant_chave_uq`(`estabelecimentoId`, `chaveIdempotencia`),
    INDEX `importacoes_contatos_lotes_estabelecimentoId_createdAt_idx`(`estabelecimentoId`, `createdAt`),
    INDEX `importacoes_contatos_lotes_operadorId_idx`(`operadorId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `importacoes_contatos_itens` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `loteId` VARCHAR(191) NOT NULL,
    `usuarioId` INTEGER NULL,
    `referencia` VARCHAR(191) NOT NULL,
    `fingerprint` VARCHAR(191) NOT NULL,
    `resultado` VARCHAR(191) NOT NULL,
    `motivo` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    UNIQUE INDEX `importacoes_contatos_itens_loteId_referencia_key`(`loteId`, `referencia`),
    INDEX `importacoes_contatos_itens_usuarioId_idx`(`usuarioId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `importacoes_contatos_lotes` ADD CONSTRAINT `importacoes_contatos_lotes_estabelecimentoId_fkey` FOREIGN KEY (`estabelecimentoId`) REFERENCES `estabelecimentos`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `importacoes_contatos_lotes` ADD CONSTRAINT `importacoes_contatos_lotes_operadorId_fkey` FOREIGN KEY (`operadorId`) REFERENCES `usuarios`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `importacoes_contatos_itens` ADD CONSTRAINT `importacoes_contatos_itens_loteId_fkey` FOREIGN KEY (`loteId`) REFERENCES `importacoes_contatos_lotes`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `importacoes_contatos_itens` ADD CONSTRAINT `importacoes_contatos_itens_usuarioId_fkey` FOREIGN KEY (`usuarioId`) REFERENCES `usuarios`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
