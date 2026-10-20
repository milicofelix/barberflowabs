CREATE TABLE `campanhas_comunicacao` (
 `id` INTEGER NOT NULL AUTO_INCREMENT, `estabelecimentoId` INTEGER NOT NULL, `templateId` INTEGER NOT NULL,
 `nome` VARCHAR(191) NOT NULL, `status` VARCHAR(191) NOT NULL DEFAULT 'RASCUNHO', `filtros` JSON NOT NULL,
 `templateSnapshot` JSON NULL, `intervaloMinimoHoras` INTEGER NOT NULL DEFAULT 168,
 `audienciaCongeladaEm` DATETIME(3) NULL, `agendadoPara` DATETIME(3) NULL, `concluidaEm` DATETIME(3) NULL,
 `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3), `updatedAt` DATETIME(3) NOT NULL,
 PRIMARY KEY (`id`), INDEX `campanhas_comunicacao_estabelecimentoId_status_createdAt_idx` (`estabelecimentoId`,`status`,`createdAt`),
 INDEX `campanhas_comunicacao_status_agendadoPara_idx` (`status`,`agendadoPara`),
 CONSTRAINT `campanhas_comunicacao_estabelecimentoId_fkey` FOREIGN KEY (`estabelecimentoId`) REFERENCES `estabelecimentos`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
 CONSTRAINT `campanhas_comunicacao_templateId_fkey` FOREIGN KEY (`templateId`) REFERENCES `templates_comunicacao`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
ALTER TABLE `envios_comunicacao` ADD COLUMN `campanhaId` INTEGER NULL,
 ADD INDEX `envios_comunicacao_campanhaId_status_idx` (`campanhaId`,`status`),
 ADD INDEX `envios_marketing_frequencia_idx` (`estabelecimentoId`,`usuarioId`,`canal`,`createdAt`),
 ADD CONSTRAINT `envios_comunicacao_campanhaId_fkey` FOREIGN KEY (`campanhaId`) REFERENCES `campanhas_comunicacao`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
CREATE TABLE `campanhas_destinatarios` (
 `id` INTEGER NOT NULL AUTO_INCREMENT, `campanhaId` INTEGER NOT NULL, `clienteId` INTEGER NULL, `usuarioId` INTEGER NOT NULL, `envioId` INTEGER NULL,
 `status` VARCHAR(191) NOT NULL DEFAULT 'PENDENTE', `motivo` VARCHAR(191) NULL, `evidencia` JSON NOT NULL,
 `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3), `updatedAt` DATETIME(3) NOT NULL,
 PRIMARY KEY (`id`), UNIQUE INDEX `campanhas_destinatarios_campanhaId_usuarioId_key` (`campanhaId`,`usuarioId`),
 UNIQUE INDEX `campanhas_destinatarios_envioId_key` (`envioId`), INDEX `campanhas_destinatarios_campanhaId_status_id_idx` (`campanhaId`,`status`,`id`),
 CONSTRAINT `campanhas_destinatarios_campanhaId_fkey` FOREIGN KEY (`campanhaId`) REFERENCES `campanhas_comunicacao`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
 CONSTRAINT `campanhas_destinatarios_clienteId_fkey` FOREIGN KEY (`clienteId`) REFERENCES `clientes_estabelecimentos`(`id`) ON DELETE SET NULL ON UPDATE CASCADE,
 CONSTRAINT `campanhas_destinatarios_envioId_fkey` FOREIGN KEY (`envioId`) REFERENCES `envios_comunicacao`(`id`) ON DELETE SET NULL ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE TABLE `supressoes_comunicacao` (
 `id` INTEGER NOT NULL AUTO_INCREMENT, `estabelecimentoId` INTEGER NOT NULL, `usuarioId` INTEGER NOT NULL, `canal` VARCHAR(191) NOT NULL,
 `ativa` BOOLEAN NOT NULL DEFAULT true, `motivo` VARCHAR(300) NOT NULL, `ultimoDisparoEm` DATETIME(3) NULL, `ultimoEnvioId` INTEGER NULL, `intervaloReservadoHoras` INTEGER NOT NULL DEFAULT 168,
 `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3), `updatedAt` DATETIME(3) NOT NULL,
 PRIMARY KEY (`id`), UNIQUE INDEX `supressoes_comunicacao_estabelecimentoId_usuarioId_canal_key` (`estabelecimentoId`,`usuarioId`,`canal`),
 CONSTRAINT `supressoes_comunicacao_estabelecimentoId_fkey` FOREIGN KEY (`estabelecimentoId`) REFERENCES `estabelecimentos`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
 CONSTRAINT `supressoes_comunicacao_usuarioId_fkey` FOREIGN KEY (`usuarioId`) REFERENCES `usuarios`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
